"""Application side of the protected supervisor's local readiness protocol."""
import hmac
import os
from pathlib import Path
from fastapi import HTTPException, Request


def internal(request: Request):
    expected = os.environ.get("CONTROL_NEST_INTERNAL_TOKEN", "")
    if not expected or request.client is None or request.client.host != "127.0.0.1" or not hmac.compare_digest(expected, request.headers.get("x-maintenance-token", "")):
        raise HTTPException(status_code=404, detail="Not found")


def paused():
    return os.environ.get("CONTROL_NEST_SUPERVISED") == "1" and Path("/run/control-nest/paused").exists()
