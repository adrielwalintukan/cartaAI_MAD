from app.repos.common import first


def get(db, user_id: str) -> dict | None:
    return first(db.table("profiles").select("*").eq("id", user_id).limit(1).execute())


def update(db, user_id: str, values: dict) -> dict | None:
    return first(db.table("profiles").update(values).eq("id", user_id).execute())
