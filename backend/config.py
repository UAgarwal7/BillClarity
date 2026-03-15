# BillClarity Backend Configuration

import json
from typing import List, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # AWS — Core
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "billclarity-docs"

    # AWS — SQS
    sqs_queue_url: str = ""
    sqs_dlq_url: str = ""

    # AWS — Lambda
    lambda_function_name: str = "billclarity-parsing-trigger"

    # Pipeline mode: "local" = BackgroundTasks, "aws" = Lambda-driven
    pipeline_mode: str = "local"

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
    allowed_origins: Any = ["*"]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            # Handle JSON array format ["*", "url"]
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            # Handle comma separated strings "url1, url2" or just "*"
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
