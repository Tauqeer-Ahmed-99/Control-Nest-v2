import asyncio
import json
import os
import re
import time
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl
from uuid import UUID, uuid4

from starlette.datastructures import Headers

from services.json_store import STORE_BASE_PATH


REQUEST_ID_HEADER = b"x-request-id"
REQUEST_ID_CONTEXT: ContextVar[str | None] = ContextVar(
    "request_id", default=None
)
SECRET_FIELD = re.compile(
    r"authorization|cookie|password|token|secret|credential|private.?key|api.?key", re.I
)
BEARER_SECRET = re.compile(r"\b(Bearer|Basic)\s+[^\s\"']+", re.I)
JWT_SECRET = re.compile(r"\beyJ[a-zA-Z0-9_-]{10,}\.[\w-]{10,}\.[\w-]{10,}\b")
QUERY_SECRET = re.compile(
    r"([?&](?:access_token|token|api_key|key|password|secret)=)[^&\s]+", re.I
)
URL_CREDENTIALS = re.compile(r"(https?://)[^/@\s]+:[^/@\s]+@", re.I)
STORE_PATH = Path(STORE_BASE_PATH) / "observability.jsonl"


def current_request_id() -> str:
    return REQUEST_ID_CONTEXT.get() or str(uuid4())


def _safe_string(value: str) -> str:
    value = BEARER_SECRET.sub(r"\1 [REDACTED]", value)
    value = JWT_SECRET.sub("[REDACTED]", value)
    value = QUERY_SECRET.sub(r"\1[REDACTED]", value)
    return URL_CREDENTIALS.sub(r"\1[REDACTED]@", value)


def _redact(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: "[REDACTED]" if SECRET_FIELD.search(str(key)) else _redact(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [_redact(item) for item in value]
    if isinstance(value, str):
        return _safe_string(value)
    return value


def _parse_body(value: bytes) -> Any:
    if not value:
        return None
    try:
        return _redact(json.loads(value.decode("utf-8")))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return _redact(value.decode("utf-8", errors="replace"))


def _safe_headers(raw_headers: list[tuple[bytes, bytes]]) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_name, raw_value in raw_headers:
        name = raw_name.decode("latin-1")
        value = raw_value.decode("latin-1")
        values[name] = "[REDACTED]" if SECRET_FIELD.search(name) else _safe_string(value)
    return values


def _append_event(event: dict[str, Any]) -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    descriptor = os.open(
        STORE_PATH,
        os.O_APPEND | os.O_CREAT | os.O_WRONLY,
        0o600,
    )
    with os.fdopen(descriptor, "a", encoding="utf-8") as file:
        file.write(json.dumps(event, separators=(",", ":"), default=str) + "\n")
        file.flush()
        os.fsync(file.fileno())


class ObservabilityMiddleware:
    def __init__(self, app: Any, api_service: Any, config_service: Any):
        self.app = app
        self.api_service = api_service
        self.config_service = config_service

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        request_headers = Headers(scope=scope)
        supplied_id = request_headers.get("x-request-id", "")
        try:
            request_id = str(UUID(supplied_id))
        except (ValueError, AttributeError):
            request_id = str(uuid4())

        incoming_headers = [
            (name, value)
            for name, value in scope.get("headers", [])
            if name.lower() != REQUEST_ID_HEADER
        ]
        incoming_headers.append((REQUEST_ID_HEADER, request_id.encode("ascii")))
        scope["headers"] = incoming_headers

        request_chunks: list[bytes] = []
        response_chunks: list[bytes] = []
        response_headers: list[tuple[bytes, bytes]] = []
        status_code = 500
        response_started = False
        caught_error: Exception | None = None
        started_at = time.perf_counter()
        context_token = REQUEST_ID_CONTEXT.set(request_id)

        more_body = True
        while more_body:
            message = await receive()
            if message.get("type") != "http.request":
                break
            request_chunks.append(message.get("body", b""))
            more_body = message.get("more_body", False)
        request_body = b"".join(request_chunks)
        body_replayed = False

        async def replay_receive() -> dict[str, Any]:
            nonlocal body_replayed
            if not body_replayed:
                body_replayed = True
                return {
                    "type": "http.request",
                    "body": request_body,
                    "more_body": False,
                }
            return {"type": "http.disconnect"}

        async def capture_send(message: dict[str, Any]) -> None:
            nonlocal status_code, response_headers, response_started
            if message.get("type") == "http.response.start":
                response_started = True
                status_code = message["status"]
                response_headers = [
                    (name, value)
                    for name, value in message.get("headers", [])
                    if name.lower() != REQUEST_ID_HEADER
                ]
                response_headers.append((REQUEST_ID_HEADER, request_id.encode("ascii")))
                message["headers"] = response_headers
            elif message.get("type") == "http.response.body":
                response_chunks.append(message.get("body", b""))
            await send(message)

        try:
            await self.app(scope, replay_receive, capture_send)
        except Exception as error:
            caught_error = error
            if not response_started:
                error_body = json.dumps(
                    {
                        "success": False,
                        "message": "Server Error",
                        "data": None,
                        "errors": None,
                    }
                ).encode("utf-8")
                await capture_send(
                    {
                        "type": "http.response.start",
                        "status": 500,
                        "headers": [(b"content-type", b"application/json")],
                    }
                )
                await capture_send(
                    {
                        "type": "http.response.body",
                        "body": error_body,
                        "more_body": False,
                    }
                )
        finally:
            output_body = b"".join(response_chunks)
            input_value = {
                "headers": _safe_headers(incoming_headers),
                "query": _redact(
                    dict(
                        parse_qsl(
                            scope.get("query_string", b"").decode("utf-8"),
                            keep_blank_values=True,
                        )
                    )
                ),
                "body": _parse_body(request_body),
            }
            parsed_output = _parse_body(output_body)
            output = {
                "headers": _safe_headers(response_headers),
                "body": parsed_output,
            }
            error_value = None
            if caught_error is not None or status_code >= 400 or (
                isinstance(parsed_output, dict) and parsed_output.get("success") is False
            ):
                if isinstance(parsed_output, dict):
                    error_value = _redact(
                        {
                            "message": parsed_output.get("message"),
                            "errors": parsed_output.get("errors"),
                            **(
                                {"type": type(caught_error).__name__}
                                if caught_error is not None
                                else {}
                            ),
                        }
                    )
                else:
                    error_value = {"statusCode": status_code}
                if caught_error is not None and isinstance(error_value, dict):
                    error_value["type"] = type(caught_error).__name__

            try:
                event = {
                    "id": str(uuid4()),
                    "requestId": request_id,
                    "source": "controller",
                    "method": scope.get("method", "GET"),
                    "path": scope.get("path", "/"),
                    "statusCode": status_code,
                    "durationMs": max(
                        0, round((time.perf_counter() - started_at) * 1000)
                    ),
                    "input": input_value,
                    "output": output,
                    "error": error_value,
                    "controllerDeviceId": self.config_service.get(
                        "controllerDevice", "id"
                    ),
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                }
                _append_event(event)
                await asyncio.to_thread(self.api_service.push_observability_event, event)
            except Exception as error:
                print(f"Unable to persist controller observability event: {type(error).__name__}")
            finally:
                REQUEST_ID_CONTEXT.reset(context_token)
