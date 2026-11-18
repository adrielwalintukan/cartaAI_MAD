"""Tes integrasi ke project Supabase UJI. Dilewati bila TEST_SUPABASE_URL / TEST_SUPABASE_SERVICE_ROLE_KEY kosong.

Catatan: tes ini belum pernah dijalankan (kunci service-role tidak tersedia saat F1 ditulis).
"""
import os
from uuid import uuid4

import pytest

URL, KEY = os.getenv("TEST_SUPABASE_URL"), os.getenv("TEST_SUPABASE_SERVICE_ROLE_KEY")
pytestmark = [pytest.mark.integration, pytest.mark.skipif(not (URL and KEY), reason="TEST_SUPABASE_* kosong")]


@pytest.fixture
def sb():
    from supabase import create_client
    return create_client(URL, KEY)


@pytest.fixture
def user(sb):
    u = sb.auth.admin.create_user({"email": f"it-{uuid4().hex[:8]}@example.com", "password": uuid4().hex,
                                   "email_confirm": True}).user
    yield u
    sb.auth.admin.delete_user(u.id)


def _inv(sb, owner, plan="free"):
    return sb.table("invitations").insert({"owner_id": owner.id, "slug": f"it-{uuid4().hex[:10]}", "title": "T",
                                           "plan": plan}).execute().data[0]


def test_profile_created_by_trigger(sb, user):
    assert sb.table("profiles").select("id").eq("id", user.id).execute().data


def test_mark_order_paid_atomic_and_idempotent(sb, user):
    inv = _inv(sb, user)
    mid = f"carta-{uuid4()}"
    sb.table("orders").insert({"midtrans_order_id": mid, "invitation_id": inv["id"], "user_id": user.id,
                               "amount": 99000}).execute()
    args = {"p_midtrans_order_id": mid, "p_transaction_id": "t", "p_payment_type": "qris", "p_fraud_status": None,
            "p_premium_days": 365}
    assert sb.rpc("mark_order_paid", args).execute().data is True
    assert sb.rpc("mark_order_paid", args).execute().data is False
    assert sb.table("invitations").select("plan").eq("id", inv["id"]).execute().data[0]["plan"] == "premium"


def test_one_pending_order_per_invitation(sb, user):
    inv = _inv(sb, user)
    row = {"invitation_id": inv["id"], "user_id": user.id, "amount": 99000}
    sb.table("orders").insert({**row, "midtrans_order_id": f"carta-{uuid4()}"}).execute()
    with pytest.raises(Exception):
        sb.table("orders").insert({**row, "midtrans_order_id": f"carta-{uuid4()}"}).execute()


def test_owner_filter_in_repo_queries(sb, user):
    from app.repos import invitations as repo
    other = sb.auth.admin.create_user({"email": f"it-{uuid4().hex[:8]}@example.com", "password": uuid4().hex,
                                       "email_confirm": True}).user
    try:
        inv = _inv(sb, user)
        assert repo.get_owned(sb, inv["id"], user.id) is not None
        assert repo.get_owned(sb, inv["id"], other.id) is None
    finally:
        sb.auth.admin.delete_user(other.id)
