"""应用配置"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 3492
    cors_origins: list[str] = ["http://localhost:3493"]
    log_level: str = "INFO"
    log_file: str = "app.log"
    log_max_size: int = 10 * 1024 * 1024
    log_backup_count: int = 5

    model_config = {"env_file": ".env", "env_prefix": "APP_"}


settings = Settings()
