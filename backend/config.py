# BillClarity Backend Configuration

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # AWS
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "billclarity-docs"

    # Google Gemini
    gemini_api_key: str = ""

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"

    # ElevenLabs (stretch)
    elevenlabs_api_key: str = ""

    # n8n (stretch)
    n8n_base_url: str = "http://localhost:5678"

    # Server
    port: int = 8000
    host: str = "0.0.0.0"
    environment: str = "development"
    allowed_origins: List[str] = [
        "https://*.base44.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
