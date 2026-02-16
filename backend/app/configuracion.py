from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SYNC_TOKEN: str

    # Entorno: "development" | "production". En production se exige JWT_SECRET seguro.
    ENVIRONMENT: str = "development"

    # Auth (JWT). En producción JWT_SECRET debe ser un secreto fuerte y único.
    AUTH_ENABLED: bool = False
    AUTH_EMAIL: str = ""
    AUTH_PASSWORD: str = ""
    AUTH_ROL: str = "operador"
    JWT_SECRET: str = ""  # En production obligatorio y distinto del valor por defecto
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 1 día

    # CORS: orígenes permitidos, separados por coma. Si no se define, se usan localhost.
    # Ejemplo producción: CORS_ORIGINS=https://app.tudominio.com,https://www.tudominio.com
    CORS_ORIGINS: str = ""

    # Carga primero .env (prod) y luego .env.local (dev)
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        case_sensitive=False
    )


settings = Settings()
