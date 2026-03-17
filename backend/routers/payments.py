from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import uuid
import hashlib
import os
from datetime import datetime, timedelta
from dependencies import supabase, snap, get_current_user, MIDTRANS_SERVER_KEY

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)

class PaymentRequest(BaseModel):
    plan: str

class MidtransWebhookPayload(BaseModel):
    transaction_time: Optional[str] = None
    transaction_status: str
    transaction_id: str
    status_message: Optional[str] = None
    status_code: str
    signature_key: str
    order_id: str
    merchant_id: Optional[str] = None
    gross_amount: str
    fraud_status: Optional[str] = None
    currency: Optional[str] = None

    class Config:
        extra = "allow" # Izinkan field tambahan dari Midtrans

@router.post("/create-transaction", tags=["Payments"])
def create_midtrans_transaction(payment: PaymentRequest, current_user: dict = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    user_id = getattr(current_user, 'id', None) or current_user.get('id')
    gross_amount = 99000

    try:
        # 1. Cari ID Langganan di tbl_m_subs
        print(f"DEBUG: Searching for plan: {payment.plan}")
        subs_res = supabase.table("tbl_m_subs").select("id_subs").eq("subs_name", payment.plan).execute()
        
        if not subs_res.data:
            # Jika tidak ketemu, coba cari yang namanya mirip atau ambil ID pertama sebagai fallback (hanya untuk testing)
            all_subs = supabase.table("tbl_m_subs").select("*").execute()
            if not all_subs.data:
                raise HTTPException(status_code=400, detail="Master data langganan (tbl_m_subs) kosong. Silakan isi dulu di Supabase.")
            id_subs = all_subs.data[0]['id_subs']
            print(f"DEBUG: Plan not found, using fallback: {id_subs}")
        else:
            id_subs = subs_res.data[0]['id_subs']

        # 2. Simpan data transaksi awal
        subscription_data = {
            "id_t_subs": order_id,
            "id_user": user_id,
            "id_subs": id_subs,
            "start_date": datetime.utcnow().isoformat(),
            "is_active": False,
            "created_by": user_id,
            "updated_by": user_id
        }
        supabase.table("tbl_t_subs").insert(subscription_data).execute()

        # 3. Buat transaksi Midtrans
        param = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": gross_amount
            },
            "customer_details": {
                "first_name": user_id[:8],
                "email": getattr(current_user, 'email', "user@example.com")
            }
        }
        
        transaction = snap.create_transaction(param)
        return transaction
        
    except HTTPException as he:
        # Re-raise HTTPException to keep its status code (e.g. 400)
        raise he
    except Exception as e:
        import traceback
        print(f"ERROR in create-transaction: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Gagal membuat transaksi: {str(e)}")

    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount
        },
        "customer_details": {
            "email": current_user.email
        }
    }

    # URL Konfigurasi
    backend_url = os.environ.get("BACKEND_URL")
    frontend_url = os.environ.get("FRONTEND_URL") or "https://cartaaimad-production.up.railway.app"
    
    if backend_url:
        # Redirect browser ke Frontend
        param["callbacks"] = {
            "finish": f"{frontend_url.rstrip('/')}/payment-status",
            "error": f"{frontend_url.rstrip('/')}/payment-status",
            "pending": f"{frontend_url.rstrip('/')}/payment-status"
        }
        # Webhook tetap ke Backend (ngrok)
        param["notification_url"] = f"{backend_url.rstrip('/')}/api/payments/midtrans-notification"
        print(f"DEBUG: Transaction created with notification_url: {param['notification_url']}")

    try:
        transaction = snap.create_transaction(param)
        return {"token": transaction['token']}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Midtrans Library Error: {str(e)}")

async def process_midtrans_logic(payload: MidtransWebhookPayload):
    print(f"DEBUG: Processing Midtrans payload for Order ID: {payload.order_id}")
    
    # 1. Verifikasi signature key
    signature_payload = f"{payload.order_id}{payload.status_code}{payload.gross_amount}{MIDTRANS_SERVER_KEY}".encode()
    expected_signature = hashlib.sha512(signature_payload).hexdigest()

    if payload.signature_key != expected_signature:
        print(f"ERROR: Signature mismatch! Expected: {expected_signature}, Got: {payload.signature_key}")
        return {"error": "Invalid signature key", "status_code": 403}

    print("DEBUG: Signature verified successfully.")
    order_id = payload.order_id
    transaction_status = payload.transaction_status
    fraud_status = payload.fraud_status

    # 2. Proses transaksi sukses
    if transaction_status in ['capture', 'settlement'] and fraud_status == 'accept':
        try:
            subscription_response = supabase.table("tbl_t_subs").select("id_user").eq("id_t_subs", order_id).single().execute()
            
            if not subscription_response.data:
                print(f"ERROR: Order ID {order_id} not found in tbl_t_subs table.")
                return {"error": f"Subscription {order_id} not found", "status_code": 404}

            user_id = subscription_response.data['id_user']
            print(f"DEBUG: Found User ID {user_id} for Order ID {order_id}")

            # Update Subscriptions
            end_date = datetime.utcnow() + timedelta(days=30)
            sub_update = supabase.table("tbl_t_subs").update({
                "is_active": True,
                "end_date": end_date.isoformat(),
                "updated_date": datetime.utcnow().isoformat(),
                "updated_by": "midtrans_webhook"
            }).eq("id_t_subs", order_id).execute()
            print("DEBUG: tbl_t_subs table updated to active.")

            return {"message": "Success", "user_id": user_id}
        
        except Exception as e:
            print(f"ERROR: Database update failed: {str(e)}")
            return {"error": str(e), "status_code": 500}

    elif transaction_status in ['cancel', 'deny', 'expire']:
        print(f"DEBUG: Transaction {order_id} failed with status: {transaction_status}")
        supabase.table("tbl_t_subs").update({
            "is_active": False,
            "updated_date": datetime.utcnow().isoformat(),
            "updated_by": "midtrans_webhook"
        }).eq("id_t_subs", order_id).execute()
        return {"message": "Transaction failed"}

    return {"message": "No action taken for status: " + transaction_status}

@router.post("/midtrans-notification", tags=["Payments"])
async def handle_midtrans_notification(payload: MidtransWebhookPayload):
    result = await process_midtrans_logic(payload)
    if "error" in result:
        raise HTTPException(status_code=result["status_code"], detail=result["error"])
    return result
