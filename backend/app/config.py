from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Union


class Settings(BaseSettings):
    """Application configuration"""
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    document_service_url: str = "http://localhost:3001"
    cors_origins: Union[list, str] = "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> list:
        """Convert cors_origins to list if it's a string"""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",")]
        return self.cors_origins


@lru_cache()
def get_settings() -> Settings:
    return Settings()
