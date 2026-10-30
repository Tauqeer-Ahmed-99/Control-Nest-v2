from typing import Any, Generic, TypeVar

from fastapi.responses import JSONResponse
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str
    data: T | None = None
    errors: Any = None

    @classmethod
    def from_data(
        cls,
        *,
        message: str,
        data: T,
        status_code: int = 200,
    ) -> JSONResponse:
        response = cls(
            success=True,
            message=message,
            data=data,
            errors=None,
        )

        return JSONResponse(
            content=response.model_dump(mode="json"),
            status_code=status_code,
        )

    @classmethod
    def from_error(cls, error: Exception | BaseException) -> JSONResponse:
        if isinstance(error, APIError):
            response = cls(
                success=False,
                message=error.message,
                data=None,
                errors=error.errors,
            )

            return JSONResponse(
                content=response.model_dump(mode="json"),
                status_code=error.status_code,
            )

        if isinstance(error, Exception):
            response = cls(
                success=False,
                message=str(error),
                data=None,
                errors=None,
            )

            return JSONResponse(
                content=response.model_dump(mode="json"),
                status_code=500,
            )

        return JSONResponse(
            content={
                "success": False,
                "message": "Server Error",
                "data": None,
                "errors": None,
            },
            status_code=500,
        )


class APIError(Exception, Generic[T]):
    def __init__(
        self,
        *,
        message: str,
        errors: T | None = None,
        status_code: int = 500,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.errors = errors
        self.status_code = status_code