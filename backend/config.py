from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    
    SECRET_KEY: str = "change-this-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    
    SERVER_API_KEY: str = ""
    MODEL: str = "llama-3.3-70b-versatile"
    SERVER_BASE_URL: str = "https://api.groq.com/openai/v1/chat/completions"
    
    MULTILINGUAL_API_KEY: str = ""
    MULTILINGUAL_MODEL: str = "llama-3.3-70b-versatile"
    MULTILINGUAL_BASE_URL: str = "https://api.openai.com/v1/chat/completions"

    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
