from app.repos.common import first, rows


def list_active(db) -> list[dict]:
    return rows(db.table("style_presets").select("*").eq("is_active", True).order("sort_order").execute())


def get(db, preset_id: str) -> dict | None:
    return first(db.table("style_presets").select("*").eq("id", preset_id).eq("is_active", True).limit(1).execute())
