from app.repos.common import first, rows


def list_for(db, inv_id: str, limit: int = 100, offset: int = 0) -> list[dict]:
    return rows(db.table("guests").select("*").eq("invitation_id", inv_id).order("created_at")
                .range(offset, offset + limit - 1).execute())


def all_for(db, inv_id: str) -> list[dict]:
    return rows(db.table("guests").select("*").eq("invitation_id", inv_id).execute())


def count(db, inv_id: str) -> int:
    return len(rows(db.table("guests").select("id").eq("invitation_id", inv_id).execute()))


def get(db, guest_id: str) -> dict | None:
    return first(db.table("guests").select("*").eq("id", guest_id).limit(1).execute())


def find_by_key(db, inv_id: str, name_key: str) -> dict | None:
    return first(db.table("guests").select("*").eq("invitation_id", inv_id).eq("name_key", name_key).limit(1).execute())


def insert_many(db, items: list[dict]) -> list[dict]:
    return rows(db.table("guests").insert(items).execute()) if items else []


def update(db, guest_id: str, values: dict) -> dict | None:
    return first(db.table("guests").update(values).eq("id", guest_id).execute())


def delete(db, guest_id: str) -> None:
    db.table("guests").delete().eq("id", guest_id).execute()
