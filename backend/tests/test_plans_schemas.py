import pytest
from pydantic import ValidationError

from app.errors import AppError
from app.schemas.invitation import InvitationCreate, InvitationData
from app.services import plans


def test_generation_quota_per_plan(settings):
    plans.check_generation_quota("free", 2, settings)
    with pytest.raises(AppError) as e:
        plans.check_generation_quota("free", 3, settings)
    assert e.value.code == "quota_exceeded" and e.value.details == {"used": 3, "limit": 3}
    plans.check_generation_quota("premium", 14, settings)
    with pytest.raises(AppError):
        plans.check_generation_quota("premium", 15, settings)


def test_premium_fields_rejected_on_free():
    with pytest.raises(AppError) as e:
        plans.check_premium_fields("free", {"gifts": [{"bank": "BCA"}]})
    assert e.value.code == "premium_required" and e.value.details["fields"] == ["gifts"]
    with pytest.raises(AppError):
        plans.check_premium_fields("free", {}, preset_premium_only=True)
    plans.check_premium_fields("premium", {"gifts": [{"bank": "BCA"}], "color_theme": "x"}, True)
    plans.check_premium_fields("free", {})


def test_guest_limit(settings):
    plans.check_guest_limit("free", 49, 1, settings)
    with pytest.raises(AppError):
        plans.check_guest_limit("free", 50, 1, settings)
    plans.check_guest_limit("premium", 5000, 100, settings)


def test_time_format_with_timezone_rejected():
    with pytest.raises(ValidationError) as e:
        InvitationData.model_validate({"ceremony": {"time": "09.00 WITA"}})
    assert "HH:MM" in str(e.value)


def test_slug_rules():
    for bad in ("ab", "-abc", "abc-", "a--b", "ABC d", "x" * 41):
        with pytest.raises(ValidationError):
            InvitationCreate(slug=bad)
    assert InvitationCreate(slug="Adriel-Tiara").slug == "adriel-tiara"


def test_missing_and_title():
    d = InvitationData.model_validate({"groom": {"name": "A"}})
    assert d.missing() == ["bride.name", "event_date", "ceremony.location"]
    full = InvitationData.model_validate({"groom": {"name": "A"}, "bride": {"name": "B"}})
    assert full.title() == "A & B"


def test_account_number_validated():
    with pytest.raises(ValidationError):
        InvitationData.model_validate({"gifts": [{"bank": "BCA", "account_number": "abc"}]})


def test_design_notes_validated_and_trimmed():
    assert InvitationData.model_validate({"design_notes": "  nuansa batik  "}).design_notes == "nuansa batik"
    assert len(InvitationData.model_validate({"design_notes": "x" * 400}).design_notes) == 300


def test_color_theme_and_design_notes_not_premium():
    assert plans.premium_fields_used({"color_theme": "sage", "design_notes": "bunga"}) == []
    plans.check_premium_fields("free", {"color_theme": "sage"})
    assert plans.premium_fields_used({"gifts": [{}]}) == ["gifts"]
