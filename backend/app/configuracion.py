from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SYNC_TOKEN: str
    GOOGLE_API_KEY: str = ""

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
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://agroflow-beta.vercel.app,https://agroflow-beta-git-dev-dquirozc03s-projects.vercel.app,*"

    @property
    def origins_list(self) -> list[str]:
        """Convierte el string de CORS_ORIGINS en una lista para el middleware."""
        if not self.CORS_ORIGINS:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # TAREA-B04: Pool de Conexiones para carga alta (AWS / Producción)
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    # Carga primero .env (prod) y luego .env.local (dev)
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        case_sensitive=False
    )


settings = Settings()
