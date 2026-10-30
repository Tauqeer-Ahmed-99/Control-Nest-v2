import os
from typing import Annotated

from clerk_backend_api.security import authenticate_request
from clerk_backend_api.security.types import AuthenticateRequestOptions

from dotenv import load_dotenv

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

CLERK_JWT_KEY = os.getenv('CLERK_JWT_KEY')

if CLERK_JWT_KEY is None:
    raise Exception("CLERK_JWT_KEY is not defined in .env")
else:
    CLERK_JWT_KEY = CLERK_JWT_KEY.replace('\\n', '\n')


security = HTTPBearer(
    scheme_name="Clerk",
    description="Enter your Clerk session token.",
    auto_error=False,
)


def require_auth(
    request: Request,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(security),
    ] = None,
) -> tuple[str, str]:
    state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            jwt_key=CLERK_JWT_KEY,
            accepts_token=["session_token"]
        ),
    )

    if not state.is_signed_in:
        print("Clerk auth failure:", state.reason)
        print("Clerk auth message:", state.message)
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = str(state.payload["sub"]) # type: ignore
    access_token = str(state.token)

    return user_id, access_token
