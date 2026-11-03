"""Root helper over a protected Unix socket; no caller-selected shell or paths."""
import json
import os
import socketserver
import subprocess
import threading
from pathlib import Path

from engine import Engine, RUNTIME
from security import MaintenanceError


class Handler(socketserver.StreamRequestHandler):
    def handle(self):
        self.request.settimeout(45)
        try:
            message = json.loads(self.rfile.readline(131073))
            action = message.get("action")
            if action == "gate":
                engine.gate(message.get("headers", {}), message.get("maintenanceOnly") is True)
                result = {}
            elif action == "discovery":
                metadata, installation = engine.identity()
                result = {"installationId": installation, "name": metadata.get("controllerDevice", {}).get("name", "AutoPi-Hub v1"), "controllerDeviceId": metadata.get("controllerDevice", {}).get("id"), "hostname": metadata.get("tunnel", {}).get("hostname")}
            elif action == "tunnel":
                metadata, _ = engine.identity()
                token = metadata.get("tunnel", {}).get("token", "")
                if not token or len(token) > 8192 or not all(c.isalnum() or c in "-_=+/" for c in token):
                    raise MaintenanceError("ACCESS_DENIED", 403)
                # The helper owns the fixed credential file and service. Token is never an argument.
                from durable import sync_directory
                path = Path("/etc/cloudflared/token")
                path.parent.mkdir(mode=0o700, exist_ok=True)
                descriptor = os.open(path.with_suffix(".pending"), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
                with os.fdopen(descriptor, "w") as stream:
                    stream.write(token)
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(path.with_suffix(".pending"), path)
                sync_directory(path.parent)
                subprocess.run(["systemctl", "enable", "cloudflared.service"], check=True, capture_output=True, timeout=30)
                subprocess.run(["systemctl", "restart", "cloudflared.service"], check=True, capture_output=True, timeout=30)
                result = {}
            elif action == "rollback" and message.get("body", {}).get("recoveryGrant"):
                result = engine.offline_restore(message["body"]["recoveryGrant"])
            elif action in ("start", "rollback"):
                result, created = engine.accept(message["body"], message.get("token"), "update" if action == "start" else "rollback")
                self.wfile.write((json.dumps({"status": 202 if created else 200, "data": result}) + "\n").encode())
                return
            else:
                if action in ("status", "job") and message.get("recoveryGrant"):
                    engine.recovery_authorization(message["recoveryGrant"])
                else:
                    engine.member(message.get("token"))
                if action == "status":
                    result = engine.status()
                    # This is app-triggered, not a background release checker.
                    threading.Thread(target=engine.startup_report, daemon=True).start()
                elif action == "job":
                    result = engine.job(message["jobId"])
                else:
                    raise MaintenanceError("NOT_FOUND", 404)
            response = {"status": 200, "data": result}
        except MaintenanceError as error:
            response = {"status": error.status, "code": error.code}
        except Exception:
            response = {"status": 503, "code": "RECOVERY_REQUIRED"}
        self.wfile.write((json.dumps(response) + "\n").encode())


if __name__ == "__main__":
    engine = Engine()
    path = RUNTIME / "maintenance.sock"
    path.unlink(missing_ok=True)
    with socketserver.ThreadingUnixStreamServer(str(path), Handler) as server:
        import grp
        os.chown(path, 0, grp.getgrnam("control-nest-maintenance").gr_gid)
        path.chmod(0o660)
        threading.Thread(target=engine.recover, daemon=False).start()
        server.serve_forever()
