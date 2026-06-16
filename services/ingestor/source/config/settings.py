from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    ingestor_port: int = 8000

    model_config = SettingsConfigDict(
        env_prefix="",
        extra="ignore",
    )


def get_settings() -> Settings:
    return Settings()
