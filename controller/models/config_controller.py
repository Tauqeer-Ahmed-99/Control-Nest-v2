from pydantic import BaseModel, Field

class ConfigController(BaseModel):
    apiKey: str = Field(pattern=r"^cn_[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$")
