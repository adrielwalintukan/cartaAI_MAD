from app.repos.common import first, rows


def list_for(db, inv_id: str) -> list[dict]:
    return rows(db.table("rsvps").select("*").eq("invitation_id", inv_id).order("created_at", desc=True).execute())


def public_wishes(db, inv_id: str, limit: int, before: str | None) -> list[dict]:
    q = db.table("rsvps").select("*").eq("invitation_id", inv_id).eq("is_hidden", False)
    if before:
        q = q.lt("created_at", before)
    # kolom message tak null difilter di service (supabase-py: not_.is_ rumit di fake)
    return rows(q.order("created_at", desc=True).limit(limit * 3).execute())


def get(db, rsvp_id: str) -> dict | None:
    return first(db.table("rsvps").select("*").eq("id", rsvp_id).limit(1).execute())


def insert(db, row: dict) -> dict:
    return first(db.table("rsvps").insert(row).execute())


def set_hidden(db, rsvp_id: str, hidden: bool) -> dict | None:
    return first(db.table("rsvps").update({"is_hidden": hidden}).eq("id", rsvp_id).execute())
