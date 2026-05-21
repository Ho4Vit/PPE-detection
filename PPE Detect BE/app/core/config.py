import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "PPE DETECTION AI SERVICE"
    
    MODEL_PATH: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/best.pt"))
    VIOLATION_THRESHOLD_SECONDS: float = 5.0
    COOLDOWN_DUPLICATE_SECONDS: float = 60.0
    
    SPRING_BOOT_API_URL: str = "http://localhost:8080/api/v1/violations"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()