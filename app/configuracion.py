from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SYNC_TOKEN: str

    # Carga primero .env (prod) y luego .env.local (dev)
    # Si una variable existe en ambos, .env.local tiene prioridad en tu PC
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        case_sensitive=False
    )


settings = Settings()
