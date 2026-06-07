from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Externos — opcionales para desarrollo local sin integraciones
    QUETALMIAFP_API_KEY: str = ""
    BCCH_USER: str = ""
    BCCH_PASS: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./afp_dev.db"

    # CORS — permite configurar en producción
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
