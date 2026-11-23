def consume(db, user_id: str, limit: int) -> int:
    return db.rpc("consume_chat_quota", {"p_user_id": user_id, "p_limit": limit}).execute().data


def refund(db, user_id: str) -> None:
    db.rpc("refund_chat_quota", {"p_user_id": user_id}).execute()


def used_today(db, user_id: str, day: str) -> int:
    r = db.table("chat_usage").select("count").eq("user_id", user_id).eq("day", day).limit(1).execute().data
    return r[0]["count"] if r else 0
