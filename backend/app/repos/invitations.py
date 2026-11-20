from app.repos.common import first, rows


def get_owned(db, inv_id: str, owner_id: str) -> dict | None:
    return first(db.table("invitations").select("*").eq("id", inv_id).eq("owner_id", owner_id).limit(1).execute())


def get_by_slug(db, slug: str) -> dict | None:
    return first(db.table("invitations").select("*").eq("slug", slug).limit(1).execute())


def slug_exists(db, slug: str) -> bool:
    return get_by_slug(db, slug) is not None


def list_by_owner(db, owner_id: str) -> list[dict]:
    return rows(db.table("invitations").select("*").eq("owner_id", owner_id).order("created_at", desc=True).execute())


def count_by_owner(db, owner_id: str) -> int:
    return len(rows(db.table("invitations").select("id").eq("owner_id", owner_id).execute()))


def insert(db, row: dict) -> dict:
    return first(db.table("invitations").insert(row).execute())


def update(db, inv_id: str, owner_id: str, values: dict) -> dict | None:
    return first(db.table("invitations").update(values).eq("id", inv_id).eq("owner_id", owner_id).execute())


def delete(db, inv_id: str, owner_id: str) -> None:
    db.table("invitations").delete().eq("id", inv_id).eq("owner_id", owner_id).execute()


def rollback(db, inv_id: str, owner_id: str) -> None:
    db.rpc("rollback_invitation", {"p_invitation_id": inv_id, "p_owner_id": owner_id}).execute()
