from app.repos.common import first


def get(db, version_id: str) -> dict | None:
    return first(db.table("invitation_versions").select("*").eq("id", version_id).limit(1).execute())
