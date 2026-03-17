from fastapi import APIRouter, Request
from typing import Dict, Any

router = APIRouter(
    prefix="/midtrans",
    tags=["Midtrans Webhook"],
)

@router.post("/webhook")
async def midtrans_webhook(request: Request):
    """
    Endpoint for Midtrans Payment Webhook.
    Receives notification from Midtrans, logs it, and returns status ok.
    """
    try:
        # Parse JSON body
        payload = await request.json()
        
        # Log the received data
        print("------- MIDTRANS WEBHOOK RECEIVED -------")
        print(f"Payload: {payload}")
        print("------------------------------------------")
        
        # Return success response
        return {"status": "ok"}
    except Exception as e:
        print(f"ERROR: Failed to process Midtrans webhook: {str(e)}")
        # Even if processing fails, Midtrans expects a response to stop retrying
        # but for debugging we might want to know it failed.
        return {"status": "error", "message": str(e)}
