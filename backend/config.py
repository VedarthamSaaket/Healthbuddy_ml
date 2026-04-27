from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    
    # SECRET_KEY must be set in .env — no default ships with the code.
    # Generate one with: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    SUPABASE_JWT_SECRET: str = ""
    GROQ_API_KEY: str = ""
    SERVER_API_KEY: str = ""
    MODEL: str = "llama-3.3-70b-versatile"
    SERVER_BASE_URL: str = "https://api.groq.com/openai/v1/chat/completions"
    
    MULTILINGUAL_API_KEY: str = ""
    MULTILINGUAL_MODEL: str = "llama-3.3-70b-versatile"
    MULTILINGUAL_BASE_URL: str = "https://api.openai.com/v1/chat/completions"

    FRONTEND_URL: str = "http://localhost:3000"

    # Set to true in production (requires HTTPS)
    SECURE_COOKIES: bool = os.getenv("SECURE_COOKIES", "false").lower() == "true"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    def validate_secrets(self) -> None:
        """Call at startup. Raises if SECRET_KEY is missing or looks like a placeholder."""
        weak = {"", "change-this-secret-in-production", "secret", "changeme", "password"}
        if self.SECRET_KEY.lower() in weak or len(self.SECRET_KEY) < 32:
            raise RuntimeError(
                "SECRET_KEY is not set or is insecure. "
                "Add a strong value to your .env file.\n"
                "  Generate one: python -c \"import secrets; print(secrets.token_hex(32))\""
            )

settings = Settings()