from pydantic import BaseModel

class ConfigController(BaseModel):
    userId: str
    controllerName: str