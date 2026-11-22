"""Supabase palsu dalam memori: cukup untuk subset query builder yang dipakai repos/ + RPC SQL ditiru.

Catatan jujur (08 F1-12): filter `owner_id` pada SQL nyata hanya terbukti oleh tes integrasi.
"""
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4


class FakeAPIError(Exception):
    def __init__(self, code: str, message: str = ""):
        super().__init__(f"{code} {message}")
        self.code = code


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cmp(a, b):
    if isinstance(a, str) and isinstance(b, str):
        try:
            return datetime.fromisoformat(a), datetime.fromisoformat(b)
        except ValueError:
            pass
    return a, b


# tabel -> default kolom
DEFAULTS = {
    "profiles": lambda: {"created_at": _now(), "updated_at": _now(), "full_name": None, "avatar_url": None},
    "style_presets": lambda: {"premium_only": False, "is_active": True, "sort_order": 0, "created_at": _now()},
    "invitations": lambda: {"id": str(uuid4()), "preset_id": "default", "plan": "free", "status": "draft",
                            "generations_used": 0, "current_version_id": None, "previous_version_id": None,
                            "published_at": None, "expires_at": None, "created_at": _now(), "updated_at": _now(),
                            "data": {}},
    "invitation_versions": lambda: {"id": str(uuid4()), "warnings": [], "created_at": _now()},
    "invitation_assets": lambda: {"id": str(uuid4()), "position": 0, "status": "pending", "created_at": _now()},
    "guests": lambda: {"id": str(uuid4()), "phone": None, "created_at": _now(), "updated_at": _now()},
    "rsvps": lambda: {"id": str(uuid4()), "guest_id": None, "message": None, "is_hidden": False,
                      "created_at": _now()},
    "orders": lambda: {"id": str(uuid4()), "status": "pending", "snap_token": None, "redirect_url": None,
                       "payment_type": None, "transaction_id": None, "transaction_status": None,
                       "fraud_status": None, "paid_at": None, "created_at": _now(), "updated_at": _now()},
    "payment_events": lambda: {"created_at": _now()},
    "generation_jobs": lambda: {"id": str(uuid4()), "status": "queued", "stage": "queued", "attempt": 0,
                                "error_code": None, "error_message": None, "result_version_id": None,
                                "heartbeat_at": _now(), "started_at": None, "finished_at": None,
                                "created_at": _now()},
    "chat_usage": lambda: {"count": 0},
}
# (kolom, predikat-berlaku)
UNIQUE = {
    "invitations": [(("slug",), None)],
    "guests": [(("invitation_id", "name_key"), None)],
    "orders": [(("invitation_id",), lambda r: r["status"] == "pending"), (("midtrans_order_id",), None)],
    "generation_jobs": [(("invitation_id",), lambda r: r["status"] in ("queued", "running"))],
    "invitation_versions": [(("invitation_id", "version_no"), None)],
}
CHILDREN = {"invitations": ["invitation_versions", "invitation_assets", "guests", "rsvps", "orders",
                            "generation_jobs"]}


class Result:
    def __init__(self, data):
        self.data = data


class Query:
    def __init__(self, db, table):
        self.db, self.table = db, table
        self.op, self.payload, self.filters, self._order, self._limit, self._range = "select", None, [], None, None, None

    def select(self, *_a, **_k):
        return self

    def insert(self, rows):
        self.op, self.payload = "insert", rows
        return self

    def update(self, vals):
        self.op, self.payload = "update", vals
        return self

    def delete(self):
        self.op = "delete"
        return self

    def eq(self, c, v):
        self.filters.append(lambda r: r.get(c) == v)
        return self

    def neq(self, c, v):
        self.filters.append(lambda r: r.get(c) != v)
        return self

    def in_(self, c, vs):
        self.filters.append(lambda r: r.get(c) in vs)
        return self

    def lt(self, c, v):
        self.filters.append(lambda r: r.get(c) is not None and _cmp(r[c], v)[0] < _cmp(r[c], v)[1])
        return self

    def order(self, c, desc=False):
        self._order = (c, desc)
        return self

    def limit(self, n):
        self._limit = n
        return self

    def range(self, a, b):
        self._range = (a, b)
        return self

    def _match(self):
        return [r for r in self.db.tables[self.table] if all(f(r) for f in self.filters)]

    def _check_unique(self, row, ignore=None):
        for cols, pred in UNIQUE.get(self.table, []):
            if pred and not pred(row):
                continue
            for other in self.db.tables[self.table]:
                if other is ignore or other is row:
                    continue
                if pred and not pred(other):
                    continue
                if all(other.get(c) == row.get(c) for c in cols):
                    raise FakeAPIError("23505", f"duplicate key {cols}")

    def execute(self):
        t = self.db.tables[self.table]
        if self.op == "insert":
            rows = self.payload if isinstance(self.payload, list) else [self.payload]
            out = []
            for raw in rows:
                row = {**DEFAULTS.get(self.table, dict)(), **raw}
                if self.table == "guests":
                    row["name_key"] = row["name"].strip().lower()
                if self.table == "rsvps":
                    row["name_key"] = row["guest_name"].strip().lower()
                if self.table == "payment_events":
                    row["id"] = len(t) + 1
                self._check_unique(row)
                t.append(row)
                out.append(dict(row))
            return Result(out)
        if self.op == "update":
            out = []
            for r in self._match():
                new = {**r, **self.payload}
                self._check_unique(new, ignore=r)
                r.update(self.payload)
                if self.table == "guests" and "name" in self.payload:
                    r["name_key"] = r["name"].strip().lower()
                out.append(dict(r))
            return Result(out)
        if self.op == "delete":
            gone = self._match()
            for r in gone:
                t.remove(r)
                for child in CHILDREN.get(self.table, []):
                    self.db.tables[child][:] = [c for c in self.db.tables[child] if c.get("invitation_id") != r["id"]]
            return Result([dict(r) for r in gone])
        rows = [dict(r) for r in self._match()]
        if self._order:
            c, desc = self._order
            rows.sort(key=lambda r: (r.get(c) is None, str(r.get(c))), reverse=desc)
        if self._range:
            rows = rows[self._range[0]:self._range[1] + 1]
        if self._limit is not None:
            rows = rows[: self._limit]
        return Result(rows)


class Rpc:
    def __init__(self, db, name, params):
        self.db, self.name, self.params = db, name, params

    def execute(self):
        return Result(getattr(self.db, "rpc_" + self.name)(**self.params))


class Bucket:
    def __init__(self, db):
        self.db = db

    def create_signed_upload_url(self, path):
        return {"signed_url": f"https://fake/{path}?token=tok", "token": "tok", "path": path}

    def remove(self, paths):
        self.db.removed.extend(paths)


class Storage:
    def __init__(self, db):
        self.db = db

    def from_(self, _bucket):
        return Bucket(self.db)


class Auth:
    def __init__(self, db):
        self.db = db

    def get_user(self, token):
        u = self.db.tokens.get(token)
        if not u:
            raise Exception("invalid token")
        return SimpleNamespace(user=SimpleNamespace(**u))


class FakeSupabase:
    def __init__(self):
        self.tables = {n: [] for n in DEFAULTS}
        self.removed: list[str] = []
        self.tokens: dict[str, dict] = {}
        self.storage = Storage(self)
        self.auth = Auth(self)
        self.tables["style_presets"] += [
            {**DEFAULTS["style_presets"](), "id": "default", "name": "Default", "brief": "Gaya default.",
             "description": None, "preview_url": None},
            {**DEFAULTS["style_presets"](), "id": "bebas", "name": "Bebas", "brief": "Bebas.",
             "premium_only": True, "sort_order": 9, "description": None, "preview_url": None},
        ]

    def table(self, name):
        return Query(self, name)

    def rpc(self, name, params):
        return Rpc(self, name, params)

    # -------- helper tes
    def add_user(self, uid: str, email: str, token: str):
        self.tokens[token] = {"id": uid, "email": email}
        self.tables["profiles"].append({**DEFAULTS["profiles"](), "id": uid, "full_name": email.split("@")[0]})

    def one(self, table, **where):
        return next(r for r in self.tables[table] if all(r.get(k) == v for k, v in where.items()))

    # -------- tiruan fungsi SQL (05 §7)
    def rpc_commit_generation(self, p_job_id, p_html, p_model, p_warnings, p_free_days=30):
        job = self.one("generation_jobs", id=p_job_id)
        if job["status"] == "succeeded":
            return job["result_version_id"]
        if job["status"] != "running":
            raise FakeAPIError("P0001", "job_not_running")
        inv = self.one("invitations", id=job["invitation_id"])
        vs = [v["version_no"] for v in self.tables["invitation_versions"] if v["invitation_id"] == inv["id"]]
        vid = str(uuid4())
        self.tables["invitation_versions"].append({
            **DEFAULTS["invitation_versions"](), "id": vid, "invitation_id": inv["id"],
            "version_no": max(vs, default=0) + 1, "html": p_html, "model": p_model,
            "preset_id": job["input_snapshot"].get("preset_id"), "input_snapshot": job["input_snapshot"],
            "warnings": p_warnings or []})
        old_current = inv["current_version_id"]
        inv.update(previous_version_id=old_current, current_version_id=vid,
                   generations_used=inv["generations_used"] + 1, status="published",
                   published_at=inv["published_at"] or _now())
        if inv["plan"] == "free" and inv["expires_at"] is None:
            inv["expires_at"] = (datetime.now(timezone.utc) + timedelta(days=p_free_days)).isoformat()
        self.tables["invitation_versions"][:] = [
            v for v in self.tables["invitation_versions"]
            if v["invitation_id"] != inv["id"] or v["id"] in (vid, old_current)]
        job.update(status="succeeded", stage="done", result_version_id=vid, finished_at=_now())
        return vid

    def rpc_rollback_invitation(self, p_invitation_id, p_owner_id):
        inv = next((i for i in self.tables["invitations"]
                    if i["id"] == p_invitation_id and i["owner_id"] == p_owner_id), None)
        if not inv:
            raise FakeAPIError("P0001", "not_found")
        if not inv["previous_version_id"]:
            raise FakeAPIError("P0001", "no_previous_version")
        inv["current_version_id"], inv["previous_version_id"] = inv["previous_version_id"], inv["current_version_id"]

    def rpc_mark_order_paid(self, p_midtrans_order_id, p_transaction_id, p_payment_type, p_fraud_status,
                            p_premium_days=365):
        o = next((o for o in self.tables["orders"]
                  if o["midtrans_order_id"] == p_midtrans_order_id and o["status"] in ("pending", "expired")), None)
        if not o:
            return False
        fields = dict(paid_at=_now(), transaction_status="settlement",
                      transaction_id=p_transaction_id or o["transaction_id"],
                      payment_type=p_payment_type or o["payment_type"], fraud_status=p_fraud_status or o["fraud_status"])
        if any(x["invitation_id"] == o["invitation_id"] and x["status"] == "paid" and x is not o
               for x in self.tables["orders"]):
            o.update(status="duplicate", **fields)  # pembayaran ganda: undangan tidak diubah
            return False
        o.update(status="paid", paid_at=_now(), transaction_status="settlement",
                 transaction_id=p_transaction_id or o["transaction_id"],
                 payment_type=p_payment_type or o["payment_type"], fraud_status=p_fraud_status or o["fraud_status"])
        inv = self.one("invitations", id=o["invitation_id"])
        inv.update(plan="premium", expires_at=(datetime.now(timezone.utc) + timedelta(days=p_premium_days)).isoformat())
        for other in self.tables["orders"]:
            if other["invitation_id"] == o["invitation_id"] and other["status"] == "pending" and other is not o:
                other["status"] = "expired"
        return True

    def rpc_refund_order(self, p_midtrans_order_id, p_transaction_status, p_free_days=30):
        o = next((o for o in self.tables["orders"]
                  if o["midtrans_order_id"] == p_midtrans_order_id and o["status"] == "paid"), None)
        if not o:
            return False
        o.update(status="refunded", transaction_status=p_transaction_status)
        inv = self.one("invitations", id=o["invitation_id"])
        if inv["plan"] == "premium":
            limit = datetime.now(timezone.utc) + timedelta(days=p_free_days)
            cur = datetime.fromisoformat(inv["expires_at"]) if inv.get("expires_at") else limit
            inv.update(plan="free", expires_at=min(cur, limit).isoformat())
        return True

    def rpc_consume_chat_quota(self, p_user_id, p_limit):
        day = datetime.now(timezone(timedelta(hours=7))).date().isoformat()
        row = next((r for r in self.tables["chat_usage"] if r["user_id"] == p_user_id and r["day"] == day), None)
        if not row:
            row = {"user_id": p_user_id, "day": day, "count": 0}
            self.tables["chat_usage"].append(row)
        if row["count"] >= p_limit:
            return -1
        row["count"] += 1
        return p_limit - row["count"]

    def rpc_refund_chat_quota(self, p_user_id):
        for r in self.tables["chat_usage"]:
            if r["user_id"] == p_user_id:
                r["count"] = max(r["count"] - 1, 0)
