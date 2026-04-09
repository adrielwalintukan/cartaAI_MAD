from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
from .payments import process_midtrans_logic, MidtransWebhookPayload

router = APIRouter(
    prefix="/midtrans",
    tags=["Midtrans Webhook"],
)

@router.get("/webhook")
async def verify_webhook():
    """
    Endpoint for manual verification.
    """
    return {
        "status": "active",
        "message": "Midtrans Webhook is up and running. Waiting for POST notifications.",
        "usage": "This endpoint should be configured in your Midtrans Dashboard as the Notification URL."
    }

@router.post("/webhook")
async def midtrans_webhook(request: Request):
    """
    Endpoint for Midtrans Payment Webhook.
    Receives notification from Midtrans, processes it, and returns status.
    """
    try:
        # Parse JSON body
        payload_data = await request.json()
        
        # Log the received data
        print("------- MIDTRANS WEBHOOK RECEIVED -------")
        print(f"Payload: {payload_data}")
        print("------------------------------------------")
        
        # Validate and process payload
        payload = MidtransWebhookPayload(**payload_data)
        result = await process_midtrans_logic(payload)
        
        if "error" in result:
             print(f"DEBUG: Webhook processing error: {result['error']}")
             # We return 200/ok even on logic error so Midtrans doesn't keep retrying 
             # if the error is "invalid signature" or "order not found"
             return {"status": "error", "message": result["error"]}
             
        return {"status": "ok", "processed": True}
    except Exception as e:
        print(f"ERROR: Failed to process Midtrans webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

