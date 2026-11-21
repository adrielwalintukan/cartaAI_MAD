"""Satu-satunya pembaca environment (04 §6.1)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    log_level: str = "INFO"

    supabase_url: str
    supabase_service_role_key: str
    supabase_storage_bucket: str = "invitation-assets"

    gemini_api_key: str
    gemini_api_key_fallback: str = ""
    gemini_model: str = "gemini-3.1-flash-lite"
    gemini_timeout_seconds: int = 90
    gemini_max_output_tokens: int = 32768

    midtrans_server_key: str
    midtrans_is_production: bool = False
    premium_price_idr: int = 99000

    web_base_url: str
    # Domain situs publik yang me-rewrite /u/:slug ke backend (Q26). Kosong = pakai web_base_url.
    public_site_url: str = ""
    public_api_base_url: str
    cors_allowed_origins: str

    free_generation_limit: int = 3
    premium_generation_limit: int = 15
    free_guest_limit: int = 50
    free_active_days: int = 30
    premium_active_days: int = 365
    gallery_max_photos: int = 10
    chat_daily_limit: int = 20
    max_invitations_per_user: int = 5
    max_image_bytes: int = 5 * 1024 * 1024
    max_audio_bytes: int = 10 * 1024 * 1024
    job_stale_after_seconds: int = 120

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def storage_public_prefix(self) -> str:
        return f"{self.supabase_url.rstrip('/')}/storage/v1/object/public/{self.supabase_storage_bucket}/"

    def public_url(self, slug: str) -> str:
        return f"{(self.public_site_url or self.web_base_url).rstrip('/')}/u/{slug}"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
