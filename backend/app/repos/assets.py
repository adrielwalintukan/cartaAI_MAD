from app.repos.common import first, rows


def list_for(db, inv_id: str, status: str | None = None) -> list[dict]:
    q = db.table("invitation_assets").select("*").eq("invitation_id", inv_id)
    if status:
        q = q.eq("status", status)
    return rows(q.order("position").execute())


def get(db, inv_id: str, asset_id: str) -> dict | None:
    return first(db.table("invitation_assets").select("*").eq("invitation_id", inv_id).eq("id", asset_id).limit(1).execute())


def insert(db, row: dict) -> dict:
    return first(db.table("invitation_assets").insert(row).execute())


def mark_ready(db, asset_id: str) -> None:
    db.table("invitation_assets").update({"status": "ready"}).eq("id", asset_id).execute()


def delete(db, asset_id: str) -> None:
    db.table("invitation_assets").delete().eq("id", asset_id).execute()


def pending_older_than(db, iso: str) -> list[dict]:
    return rows(db.table("invitation_assets").select("*").eq("status", "pending").lt("created_at", iso).execute())
