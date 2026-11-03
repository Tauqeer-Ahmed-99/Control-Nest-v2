"""Stable listener: maintenance and a byte-preserving application proxy."""
import http.client
import json
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

SOCKET = "/run/control-nest/maintenance.sock"
HOP = {"connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"}


def helper(message):
    with socket.socket(socket.AF_UNIX) as connection:
        connection.settimeout(40)
        connection.connect(SOCKET)
        connection.sendall((json.dumps(message) + "\n").encode())
        with connection.makefile("rb") as stream:
            return json.loads(stream.readline(131073))


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *_):
        pass  # Never log authentication or credential-bearing request paths.

    def reply(self, status, data=None, code=None):
        body = json.dumps({"success": status < 400, "message": "Controller maintenance" if status < 400 else code.replace("_", " ").capitalize(), "data": data, "errors": {"code": code} if code else None}).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def dispatch(self):
        self.connection.settimeout(45)
        path = urlsplit(self.path).path
        try:
            if path.startswith("/internal/"):
                self.reply(404, code="NOT_FOUND")
                return
            if path == "/controller/firmware" or path.startswith("/controller/firmware/"):
                actions = {("GET", "/controller/firmware"): "status", ("POST", "/controller/firmware/jobs"): "start", ("POST", "/controller/firmware/rollback"): "rollback"}
                action = actions.get((self.command, path))
                message = {"action": action, "token": self.headers.get("Authorization", "").removeprefix("Bearer ")}
                if self.headers.get("X-Recovery-Grant"):
                    message["recoveryGrant"] = json.loads(self.headers["X-Recovery-Grant"])
                if self.command == "GET" and path.startswith("/controller/firmware/jobs/"):
                    message.update(action="job", jobId=path.rsplit("/", 1)[-1])
                if self.command == "POST":
                    length = int(self.headers.get("Content-Length", "0"))
                    if length <= 0 or length > 131072 or self.headers.get("Transfer-Encoding"):
                        self.reply(400, code="INVALID_REQUEST")
                        self.close_connection = True
                        return
                    message["body"] = json.loads(self.rfile.read(length))
                result = helper(message)
                self.reply(result["status"], result.get("data"), result.get("code"))
                return
            # Setup and health retain their legacy HTTP contracts during a mandatory upgrade.
            if path not in ("/", "/docs", "/openapi.json", "/redoc"):
                result = helper({"action": "gate", "maintenanceOnly": path == "/controller/configure", "headers": {key.lower(): value for key, value in self.headers.items()}})
                if result["status"] >= 400:
                    self.reply(result["status"], code=result["code"])
                    self.close_connection = True
                    return
            connection = http.client.HTTPConnection("127.0.0.1", 8001, timeout=40)
            try:
                connection.putrequest(self.command, self.path, skip_host=True, skip_accept_encoding=True)
                for key, value in self.headers.items():
                    if key.lower() not in HOP and key.lower() != "x-maintenance-token":
                        connection.putheader(key, value)
                chunked = self.headers.get("Transfer-Encoding", "").lower() == "chunked"
                if chunked:
                    connection.putheader("Transfer-Encoding", "chunked")
                connection.endheaders()
                if chunked:
                    while True:
                        line = self.rfile.readline(8192)
                        count = int(line.split(b";", 1)[0], 16)
                        connection.send(line)
                        if not count:
                            while (trailer := self.rfile.readline(8192)) != b"\r\n":
                                connection.send(trailer)
                            connection.send(b"\r\n")
                            break
                        remaining = count + 2
                        while remaining:
                            block = self.rfile.read(min(65536, remaining))
                            if not block:
                                raise ValueError()
                            connection.send(block)
                            remaining -= len(block)
                else:
                    remaining = int(self.headers.get("Content-Length", "0"))
                    while remaining:
                        block = self.rfile.read(min(65536, remaining))
                        if not block:
                            raise ValueError()
                        connection.send(block)
                        remaining -= len(block)
                response = connection.getresponse()
                if path == "/controller/configure" and response.status < 300:
                    import threading
                    threading.Thread(target=discovery.refresh, daemon=True).start()
                self.send_response_only(response.status, response.reason)
                for key, value in response.getheaders():
                    if key.lower() not in HOP:
                        self.send_header(key, value)
                self.send_header("Connection", "close")
                self.close_connection = True
                self.end_headers()
                if self.command != "HEAD":
                    while block := response.read(65536):
                        self.wfile.write(block)
            finally:
                connection.close()
        except (ValueError, KeyError):
            self.reply(400, code="INVALID_REQUEST")
            self.close_connection = True
        except (OSError, http.client.HTTPException):
            self.reply(503, code="RECOVERY_REQUIRED")
            self.close_connection = True

    do_GET = do_POST = do_PUT = do_PATCH = do_DELETE = do_HEAD = dispatch

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()


if __name__ == "__main__":
    from discovery import Discovery
    import threading
    discovery = Discovery(helper)
    threading.Thread(target=discovery.refresh, daemon=True).start()
    ThreadingHTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
