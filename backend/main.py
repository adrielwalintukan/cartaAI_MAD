# This is the main application file.
# It initializes the FastAPI app and includes the modular routers.

from fastapi import FastAPI, Request
from typing import Optional
from routers import auth, payments, invitations, chatbot, midtrans
from routers.payments import process_midtrans_logic, MidtransWebhookPayload

print("--- SERVER BERJALAN DENGAN KODE VERSI BARU ---")


# Initialize the main FastAPI application
app = FastAPI(
    title="CartaAI Backend",
    description="API for user authentication and payments.",
    version="1.0.0",
)

# Configure CORS (Cross-Origin Resource Sharing)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Izinkan semua asal untuk testing mobile
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with a global /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(invitations.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")

# Midtrans Webhook Router (Tanpa /api prefix agar jalurnya /midtrans/webhook)
app.include_router(midtrans.router)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the CartaAI Backend!"}

@app.on_event("startup")
async def startup_event():
    print("App startup complete")

@app.post("/", tags=["Root"])
async def handle_root_post(request: Request):
    # This is a fallback for misconfigured webhooks that hit the root instead of /api/payments/midtrans-notification
    try:
        body = await request.json()
        print(f"DEBUG: Received POST at root: {body}")

        # Coba proses sebagai notifikasi Midtrans jika field yang dibutuhkan ada
        if body and "order_id" in body and "transaction_status" in body:
            payload = MidtransWebhookPayload(**body)
            result = await process_midtrans_logic(payload)
            print(f"DEBUG: Root POST processing result: {result}")
            return result

        return {"message": "POST received at root. Please configure your webhook URL to /api/payments/midtrans-notification"}
    except Exception as e:
        print(f"DEBUG: Received POST at root (non-JSON or error): {e}")
        return {"message": f"POST received at root. Error: {str(e)}"}

@app.post("/midtrans-notification", tags=["Root"])
async def handle_misconfigured_path(request: Request):
    # Menangani kasus di mana Midtrans memukul /midtrans-notification bukannya /api/payments/midtrans-notification
    try:
        body = await request.json()
        print(f"DEBUG: Received POST at /midtrans-notification: {body}")

        if body and "order_id" in body and "transaction_status" in body:
            payload = MidtransWebhookPayload(**body)
            result = await process_midtrans_logic(payload)
            print(f"DEBUG: /midtrans-notification processing result: {result}")
            return result

        return {"message": "POST received at wrong path. Handled successfully."}
    except Exception as e:
        print(f"DEBUG: Error at /midtrans-notification: {e}")
        return {"message": f"Error: {str(e)}"}