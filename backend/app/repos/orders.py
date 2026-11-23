from app.repos.common import first, rows


def get_owned(db, order_id: str, user_id: str) -> dict | None:
    return first(db.table("orders").select("*").eq("id", order_id).eq("user_id", user_id).limit(1).execute())


def get_by_midtrans_id(db, mid: str) -> dict | None:
    return first(db.table("orders").select("*").eq("midtrans_order_id", mid).limit(1).execute())


def pending_for(db, inv_id: str) -> dict | None:
    return first(db.table("orders").select("*").eq("invitation_id", inv_id).eq("status", "pending").limit(1).execute())


def insert(db, row: dict) -> dict:
    return first(db.table("orders").insert(row).execute())


def update_if_status(db, order_id: str, from_status: str, values: dict) -> dict | None:
    return first(db.table("orders").update(values).eq("id", order_id).eq("status", from_status).execute())


def log_event(db, mid: str | None, source: str, payload: dict) -> None:
    db.table("payment_events").insert({"midtrans_order_id": mid, "source": source, "payload": payload}).execute()


def mark_paid(db, mid: str, tx_id, payment_type, fraud, days: int) -> bool:
    res = db.rpc("mark_order_paid", {"p_midtrans_order_id": mid, "p_transaction_id": tx_id,
                                     "p_payment_type": payment_type, "p_fraud_status": fraud,
                                     "p_premium_days": days}).execute()
    return bool(res.data)


def refund_order(db, mid: str, tx_status: str, free_days: int) -> bool:
    """Refund/chargeback penuh: order -> refunded dan undangan kembali Gratis, atomik (RPC). False bila order bukan paid."""
    res = db.rpc("refund_order", {"p_midtrans_order_id": mid, "p_transaction_status": tx_status,
                                  "p_free_days": free_days}).execute()
    return bool(res.data)
