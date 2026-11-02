"""Protected installation worker. Only exact signed releases reach execution."""
import hashlib
import json
import os
import platform
import pwd
import shutil
import subprocess
import sys
import tarfile
import threading
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from durable import exclusive, read_json, sync_directory, sync_tree, write_json
from security import MaintenanceError, trusted_time, validate_archive, verify_envelope, version

ROOT = Path("/opt/control-nest")
CONFIG = Path("/etc/control-nest")
RUNTIME = Path("/run/control-nest")
TERMINAL = {"completed", "failed", "rolled_back", "recovery_required"}
ACTIVATED = {"switching", "restarting", "checking", "rolling_back"}
UPDATER = "1.0.0"


class Engine:
    def __init__(self):
        self.storage = Path(os.environ["APP_PERSISTENT_STORAGE_PATH"])
        self.state = self.storage / "maintenance"
        self.journal = self.state / "journal.json"
        self.mutex = threading.RLock()
        self.busy = False
        self.corrupt = False
        self._policy = None
        try:
            if (self.state / "restore-in-progress.json").exists():
                raise ValueError()
            record = read_json(self.journal)
            if not isinstance(record, dict) or not isinstance(record.get("selectedRelease"), str):
                raise ValueError()
            if record.get("phase") not in TERMINAL | ACTIVATED | {"authorizing", "queued", "downloading", "verifying", "preparing", "backing_up"} or not isinstance(record.get("sequence"), int) or record["sequence"] < 0:
                raise ValueError()
            for field in ("jobId", "snapshot", "rollbackSnapshot", "previousSnapshot"):
                if record.get(field):
                    uuid.UUID(record[field])
            for field in ("sourceRelease", "targetRelease", "previousConfirmedRelease"):
                if record.get(field):
                    self.release_path(record[field])
            self.record = record
            self.release_path(record["selectedRelease"])
        except Exception:
            self.record = {}
            self.corrupt = True

    def release_path(self, release):
        version(release)
        path = ROOT / "releases" / release
        if path.is_symlink() or not path.resolve().is_relative_to((ROOT / "releases").resolve()):
            raise MaintenanceError("RECOVERY_REQUIRED")
        return path

    def identity(self):
        metadata = read_json(self.storage / "stores/controller_metadata.json", {})
        installation = read_json(self.storage / "stores/installation.json", {})
        return metadata, installation.get("id")

    def cloud(self, path, body):
        metadata, installation = self.identity()
        url = os.environ["SERVER_URL"].rstrip("/")
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            raise MaintenanceError("AUTHORIZATION_FAILED", 403)
        request = urllib.request.Request(url + "/api/v1/" + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json", "Authorization": "Bearer " + metadata.get("apiKey", ""), "X-Controller-Installation-ID": installation or ""})
        try:
            class NoRedirect(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, *_):
                    return None
            with urllib.request.build_opener(NoRedirect()).open(request, timeout=12) as response:
                result = json.load(response)
            if not result.get("success"):
                raise MaintenanceError("AUTHORIZATION_FAILED", 403)
            return result["data"]
        except (urllib.error.URLError, ValueError, KeyError):
            raise MaintenanceError("AUTHORIZATION_FAILED", 403) from None

    def member(self, token, admin=False):
        if not token or len(token) > 16000:
            raise MaintenanceError("ACCESS_DENIED", 401)
        result = self.cloud("controller-device/access", {"accessToken": token})
        if not result.get("authorized") or (admin and not result.get("isAdmin")):
            raise MaintenanceError("ACCESS_DENIED", 403)
        return result

    def status(self):
        with self.mutex:
            selected = self.record.get("selectedRelease")
            running = None
            try:
                ready = self.internal("GET", "/internal/maintenance/ready")
                running = ready.get("version")
                healthy = all(ready.get(key) for key in ("configuration", "gpio", "schedules"))
            except Exception:
                healthy = False
            previous = self.record.get("sourceRelease") if self.record.get("phase") == "recovery_required" and self.record.get("snapshot") else self.record.get("previousConfirmedRelease")
            if previous and not (self.release_path(previous) / "verified.json").exists():
                previous = None
            return {"installedRelease": running, "selectedRelease": selected, "apiContract": 1, "dataSchema": 1, "updaterVersion": UPDATER,
                    "os": sys.platform, "architecture": platform.machine(), "python": f"{sys.version_info.major}.{sys.version_info.minor}",
                    "capabilities": ["signed-updates", "snapshot-rollback", "offline-recovery"],
                    "previousRelease": previous,
                    "lastOutcome": {"jobId": self.record["jobId"], "phase": self.record["phase"], "targetVersion": self.record["targetRelease"], "failureCode": self.record.get("failureCode"), "localOnly": self.record.get("localOnly", False)} if self.record.get("jobId") and self.record.get("phase") != "authorizing" else None,
                    "recoveryRequired": self.corrupt or self.record.get("phase") == "recovery_required" or (not healthy and not self.busy)}

    def job(self, job_id):
        uuid.UUID(job_id)
        with self.mutex:
            job = read_json(self.state / "jobs" / f"{job_id}.json")
            if not job:
                raise MaintenanceError("JOB_NOT_FOUND", 404)
            status = self.status()
            return {**{k: job.get(k) for k in ("jobId", "phase", "sequence", "failureCode", "bytes", "totalBytes") if job.get(k) is not None}, "runningVersion": status["installedRelease"], "status": status}

    def persist(self, **changes):
        with self.mutex:
            self.record.update(changes)
            self.record["sequence"] = self.record.get("sequence", 0) + 1
            self.record["updatedAt"] = int(time.time())
            write_json(self.journal, self.record)
            if self.record.get("jobId"):
                write_json(self.state / "jobs" / f"{self.record['jobId']}.json", self.record)

    def phase(self, phase, **changes):
        self.persist(phase=phase, **changes)
        self.report()

    def cache_policy(self, envelope):
        if not envelope:
            return
        with self.mutex:
            policy, _ = verify_envelope(envelope, CONFIG / "trusted-release-keys")
            previous = read_json(self.state / "policy.json", {})
            if policy["revision"] >= previous.get("policy", {}).get("revision", 0) and time.time() >= __import__("datetime").datetime.fromisoformat(policy["effectiveAt"].replace("Z", "+00:00")).timestamp():
                write_json(self.state / "policy.json", {"policy": policy, "envelope": envelope, "observedAt": int(time.time())})
                self._policy = policy

    def report(self):
        if self.record.get("localOnly"):
            return
        try:
            job_id = self.record.get("jobId")
            if job_id:
                self.cloud(f"controller-device/firmware/jobs/{job_id}/events", self.job(job_id))
        except Exception:
            pass  # Journal remains authoritative. Startup and app-triggered reads reconcile.

    def startup_report(self):
        try:
            result = self.cloud("controller-device/firmware/status", self.status())
            self.cache_policy(result.get("envelope"))
            self.report()
        except Exception:
            pass

    def gate(self, headers, maintenance_only=False):
        if (RUNTIME / "paused").exists() or self.corrupt or self.record.get("phase") == "recovery_required":
            raise MaintenanceError("RECOVERY_REQUIRED" if self.corrupt or self.record.get("phase") == "recovery_required" else "UPDATE_IN_PROGRESS", 503)
        if maintenance_only:
            return
        with self.mutex:
            if self._policy is None:
                cached = read_json(self.state / "policy.json")
                if not cached:
                    return
                self._policy, _ = verify_envelope(cached["envelope"], CONFIG / "trusted-release-keys")
            policy = self._policy
        mobile = headers.get("x-mobile-release")
        if (not mobile and version(policy["minimumMobile"]) > (1, 0, 0)) or (mobile and version(mobile) < version(policy["minimumMobile"])) or version(self.record["selectedRelease"]) < version(policy["minimumController"]):
            raise MaintenanceError("UPDATE_REQUIRED", 426)
        native = policy.get("mobile", {}).get(headers.get("x-mobile-platform"))
        if native and ((native["runtimes"] and headers.get("x-mobile-runtime") not in native["runtimes"]) or self.build(headers.get("x-mobile-build", "0")) < self.build(str(native["minimumBuild"]))):
            raise MaintenanceError("UPDATE_REQUIRED", 426)
        if mobile and int(headers.get("x-controller-contract", "0")) not in policy["apiContracts"]:
            raise MaintenanceError("UPDATE_REQUIRED", 426)

    @staticmethod
    def build(value):
        if not __import__("re").fullmatch(r"\d+(\.\d+)*", value):
            raise MaintenanceError("UPDATE_REQUIRED", 426)
        return tuple(map(int, value.split(".")))

    def validate_manifest(self, envelope):
        manifest, digest = verify_envelope(envelope, CONFIG / "trusted-release-keys")
        if version(manifest["minUpdater"]) > version(UPDATER) or manifest["os"] != "linux" or manifest["architecture"] != platform.machine() or manifest["python"] != f"{sys.version_info.major}.{sys.version_info.minor}" or manifest["apiContract"] != 1 or manifest["dataSchema"] != 1 or manifest["rollback"] != "snapshot" or manifest["dependencies"] != "bundled-wheels":
            raise MaintenanceError("UNSUPPORTED_TARGET")
        version(manifest["version"])
        url = __import__("urllib.parse", fromlist=["urlparse"]).urlparse(manifest["archiveUrl"])
        if url.scheme != "https" or url.username or url.password or not 0 < manifest["size"] <= 1024 ** 3 or not 0 < manifest["unpackedSize"] <= 4 * 1024 ** 3:
            raise MaintenanceError("UNSUPPORTED_TARGET")
        return manifest, digest

    def accept(self, body, token, operation):
        with self.mutex:
            if self.corrupt:
                raise MaintenanceError("RECOVERY_REQUIRED")
            authorization, _ = verify_envelope(body["authorization"], CONFIG / "trusted-job-keys")
            job_id = str(uuid.UUID(authorization["jobId"]))
            manifest, digest = self.validate_manifest(body["manifest"])
            metadata, installation = self.identity()
            if authorization["controllerDeviceId"] != metadata.get("controllerDevice", {}).get("id") or authorization["installationId"] != installation or authorization["operation"] != operation or authorization["manifestDigest"] != digest:
                raise MaintenanceError("ACCESS_DENIED", 403)
            member = self.member(token, admin=True)
            if member.get("userId") != authorization["userId"]:
                raise MaintenanceError("ACCESS_DENIED", 403)
            # An accepted job is immutable; legitimate retries do not execute twice.
            existing = read_json(self.state / "jobs" / f"{job_id}.json")
            if existing:
                if existing["manifestDigest"] != digest or existing["nonce"] != authorization["nonce"]:
                    raise MaintenanceError("ACCESS_DENIED", 403)
                return self.job(job_id), False
            if self.busy or self.record.get("phase") not in TERMINAL:
                raise MaintenanceError("UPDATE_IN_PROGRESS")
            trusted_time()
            if not authorization["issuedAt"] <= time.time() <= authorization["expiresAt"] or authorization["expiresAt"] - authorization["issuedAt"] > 300:
                raise MaintenanceError("AUTHORIZATION_EXPIRED", 403)
            if authorization["fallback"] != self.record["selectedRelease"]:
                raise MaintenanceError("UNSUPPORTED_TARGET")
            if operation == "rollback" and manifest["version"] != self.status()["previousRelease"]:
                raise MaintenanceError("UNSUPPORTED_TARGET")
            if operation == "update" and manifest["version"] == self.record["selectedRelease"]:
                raise MaintenanceError("UNSUPPORTED_TARGET")
            with exclusive(self.state / "installation.lock"):
                source = self.record["selectedRelease"]
                rollback_snapshot = self.record.get("snapshot") if self.record.get("phase") == "recovery_required" else self.record.get("rollbackSnapshot")
                self.persist(jobId=job_id, nonce=authorization["nonce"], phase="authorizing", sourceRelease=source, targetRelease=manifest["version"], manifestDigest=digest,
                             manifest=body["manifest"], sequence=0, failureCode=None, runningVersion=source, snapshot=None,
                             previousSnapshot=rollback_snapshot, operation=operation, activationAttempts=0, confirmed=False, localOnly=False)
                try:
                    result = self.cloud(f"controller-device/firmware/jobs/{job_id}/accept", {"nonce": authorization["nonce"]})
                    self.cache_policy(result.get("envelope"))
                    self.persist(phase="queued")
                except Exception:
                    self.phase("failed", failureCode="AUTHORIZATION_EXPIRED")
                    raise
            self.busy = True
            threading.Thread(target=self.run, daemon=False).start()
            return self.job(job_id), True

    def download(self, manifest, archive):
        class HTTPSOnly(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, request, fp, code, message, headers, newurl):
                if not newurl.startswith("https://"):
                    raise MaintenanceError("DOWNLOAD_FAILED")
                return super().redirect_request(request, fp, code, message, headers, newurl)
        opener = urllib.request.build_opener(HTTPSOnly())
        for attempt in range(3):
            try:
                digest, count = hashlib.sha256(), 0
                with opener.open(manifest["archiveUrl"], timeout=30) as source, archive.open("wb") as target:
                    while block := source.read(256 * 1024):
                        count += len(block)
                        if count > manifest["size"]:
                            raise MaintenanceError("SIGNATURE_INVALID")
                        digest.update(block)
                        target.write(block)
                        if count % (4 * 1024 * 1024) < len(block):
                            self.persist(bytes=count, totalBytes=manifest["size"])
                            self.report()
                    target.flush()
                    os.fsync(target.fileno())
                if count != manifest["size"] or digest.hexdigest() != manifest["sha256"]:
                    raise MaintenanceError("SIGNATURE_INVALID")
                return
            except (OSError, urllib.error.URLError):
                if attempt == 2:
                    raise MaintenanceError("DOWNLOAD_FAILED") from None

    def service(self, action):
        if action == "start":
            subprocess.run(["systemctl", "reset-failed", "autopihub-app.service"], check=True, capture_output=True, timeout=10)
        subprocess.run(["systemctl", action, "autopihub-app.service"], check=True, capture_output=True, timeout=45)

    def internal(self, method, path):
        request = urllib.request.Request("http://127.0.0.1:8001" + path, method=method, headers={"X-Maintenance-Token": os.environ["CONTROL_NEST_INTERNAL_TOKEN"]})
        with urllib.request.urlopen(request, timeout=4) as response:
            return json.load(response)

    def select(self, release):
        destination = self.release_path(release)
        if not destination.is_dir():
            raise MaintenanceError("RECOVERY_REQUIRED")
        pending = ROOT / ".current-pending"
        pending.unlink(missing_ok=True)
        pending.symlink_to(destination)
        os.replace(pending, ROOT / "current")
        sync_directory(ROOT)

    def readiness(self, release, probation=20):
        deadline = time.monotonic() + 60
        healthy_since = None
        process_id = None
        while time.monotonic() < deadline:
            try:
                ready = self.internal("GET", "/internal/maintenance/ready")
                if ready.get("version") != release or not all(ready.get(key) for key in ("configuration", "gpio", "schedules")) or ready.get("dataSchema") != 1:
                    raise ValueError()
                if ready.get("processId") != process_id:
                    healthy_since = None
                    process_id = ready.get("processId")
                healthy_since = healthy_since or time.monotonic()
                if time.monotonic() - healthy_since >= probation:
                    return
            except Exception:
                healthy_since = None
            time.sleep(1)
        raise MaintenanceError("ACTIVATION_FAILED")

    def snapshot(self):
        name = self.record["jobId"]
        destination = self.state / "snapshots" / name
        pending = destination.with_name(name + ".pending")
        if pending.exists():
            shutil.rmtree(pending)
        if any(path.is_symlink() for path in (self.storage / "stores").rglob("*")):
            raise MaintenanceError("PREPARATION_FAILED")
        shutil.copytree(self.storage / "stores", pending, symlinks=False)
        integrity = {str(path.relative_to(pending)): hashlib.sha256(path.read_bytes()).hexdigest() for path in pending.rglob("*") if path.is_file()}
        write_json(pending / ".integrity.json", {"dataSchema": 1, "release": self.record["sourceRelease"], "files": integrity})
        sync_tree(pending)
        os.replace(pending, destination)
        sync_directory(destination.parent)
        return name

    def restore_snapshot(self, snapshot):
        uuid.UUID(snapshot)
        source = self.state / "snapshots" / snapshot
        integrity = read_json(source / ".integrity.json")
        if not integrity or integrity["dataSchema"] != 1:
            raise MaintenanceError("RECOVERY_REQUIRED")
        actual = {str(path.relative_to(source)): hashlib.sha256(path.read_bytes()).hexdigest() for path in source.rglob("*") if path.is_file() and path.name != ".integrity.json"}
        if actual != integrity["files"] or any(path.is_symlink() for path in source.rglob("*")):
            raise MaintenanceError("RECOVERY_REQUIRED")
        pending = self.storage / "stores.restore"
        old = self.storage / "stores.displaced"
        if pending.exists():
            shutil.rmtree(pending)
        shutil.copytree(source, pending, ignore=shutil.ignore_patterns(".integrity.json"))
        account = pwd.getpwnam("control-nest-app")
        for root, directories, files in os.walk(pending):
            os.chown(root, account.pw_uid, account.pw_gid)
            for name in files:
                os.chown(Path(root) / name, account.pw_uid, account.pw_gid)
        sync_tree(pending)
        if old.exists():
            shutil.rmtree(old)
        if (self.storage / "stores").exists():
            os.replace(self.storage / "stores", old)
        os.replace(pending, self.storage / "stores")
        sync_directory(self.storage)

    def prepare(self, manifest):
        target = self.release_path(manifest["version"])
        if target.exists():
            verified = read_json(target / "verified.json")
            if not verified or verified.get("digest") != self.record["manifestDigest"]:
                raise MaintenanceError("UNSUPPORTED_TARGET")
            return target
        reserve = manifest["size"] + manifest["unpackedSize"] * 3 + 128 * 1024 ** 2
        stores_size = sum(p.stat().st_size for p in (self.storage / "stores").rglob("*") if p.is_file())
        if shutil.disk_usage(ROOT).free < reserve or shutil.disk_usage(self.storage).free < stores_size * 3 + 128 * 1024 ** 2:
            raise MaintenanceError("PREPARATION_FAILED")
        archive = self.state / f"{self.record['jobId']}.tar.gz"
        self.phase("downloading", bytes=0, totalBytes=manifest["size"])
        self.download(manifest, archive)
        self.phase("verifying")
        target.mkdir(mode=0o755)
        try:
            with tarfile.open(archive, "r:gz") as package:
                validate_archive(package, target, manifest["unpackedSize"])
            if (target / "controller/VERSION").read_text().strip() != manifest["version"]:
                raise MaintenanceError("SIGNATURE_INVALID")
            self.phase("preparing")
            account = pwd.getpwnam("control-nest-build")
            for root, _, files in os.walk(target):
                os.chown(root, account.pw_uid, account.pw_gid)
                for name in files:
                    os.chown(Path(root) / name, account.pw_uid, account.pw_gid)
            python = target / "controller/.venv/bin/python"
            base = ["runuser", "-u", "control-nest-build", "--"]
            clean_env = {"PATH": "/usr/bin:/bin", "HOME": "/nonexistent", "PYTHONDONTWRITEBYTECODE": "1"}
            for command in ([sys.executable, "-m", "venv", str(python.parent.parent)],
                            [str(python), "-m", "pip", "install", "--no-index", "--only-binary=:all:", "--find-links", str(target / "wheels"), "-r", str(target / "controller/requirements.lock")],
                            [str(python), "-c", "import fastapi, clerk_backend_api, gpiozero, RPi.GPIO; import ast,pathlib; ast.parse(pathlib.Path('server.py').read_text())"]):
                subprocess.run(base + command, cwd=target / "controller", env=clean_env, check=True, timeout=600, capture_output=True)
            # The build user cannot edit a confirmed release or smuggle a link to private state.
            for root, directories, files in os.walk(target):
                for name in [*directories, *files]:
                    path = Path(root) / name
                    if path.is_symlink() and not path.resolve().is_relative_to(target.resolve()) and not (".venv" in path.parts and path.name.startswith("python")):
                        raise MaintenanceError("PREPARATION_FAILED")
                os.chown(root, 0, 0)
                os.chmod(root, 0o755)
                for name in files:
                    path = Path(root) / name
                    if not path.is_symlink():
                        os.chown(path, 0, 0)
                        path.chmod(0o755 if path.stat().st_mode & 0o111 else 0o644)
            write_json(target / "verified.json", {"digest": self.record["manifestDigest"], "manifest": self.record["manifest"]})
            sync_tree(target, allow_links=True)
        except Exception:
            shutil.rmtree(target)
            raise
        finally:
            archive.unlink(missing_ok=True)
        return target

    def run(self):
        try:
            with exclusive(self.state / "installation.lock"):
                manifest, _ = self.validate_manifest(self.record["manifest"])
                self.prepare(manifest)
                self.phase("backing_up")
                (RUNTIME / "paused").touch(mode=0o644)
                self.internal("POST", "/internal/maintenance/quiesce")
                self.service("stop")
                snapshot = self.snapshot()
                self.persist(snapshot=snapshot)
                # Every operation after this durable intent recovers the source code/data pair.
                self.phase("switching", activationAttempts=1)
                if self.record["operation"] == "rollback":
                    previous_snapshot = self.record.get("previousSnapshot")
                    if not previous_snapshot:
                        raise MaintenanceError("RECOVERY_REQUIRED")
                    self.restore_snapshot(previous_snapshot)
                self.select(self.record["targetRelease"])
                self.persist(selectedRelease=self.record["targetRelease"])
                self.phase("restarting")
                self.service("start")
                self.phase("checking")
                self.readiness(self.record["targetRelease"])
                self.persist(confirmed=True, previousConfirmedRelease=self.record["sourceRelease"], rollbackSnapshot=self.record["snapshot"], runningVersion=self.record["targetRelease"])
                self.persist(phase="completed")
                self.internal("POST", "/internal/maintenance/resume")
                (RUNTIME / "paused").unlink(missing_ok=True)
                self.report()
        except Exception as error:
            code = error.code if isinstance(error, MaintenanceError) else "PREPARATION_FAILED"
            if self.record.get("phase") in ACTIVATED or self.record.get("activationAttempts"):
                self.rollback(code)
            else:
                self.phase("failed", failureCode=code, runningVersion=self.record.get("sourceRelease"))
                try:
                    self.service("start")
                    self.internal("POST", "/internal/maintenance/resume")
                    (RUNTIME / "paused").unlink(missing_ok=True)
                except Exception:
                    self.phase("recovery_required", failureCode="RECOVERY_REQUIRED")
        finally:
            self.busy = False
            self.startup_report()

    def rollback(self, code):
        try:
            self.phase("rolling_back", failureCode=code, confirmed=False)
            (RUNTIME / "paused").touch(mode=0o644)
            self.service("stop")
            self.restore_snapshot(self.record["snapshot"])
            self.select(self.record["sourceRelease"])
            self.persist(selectedRelease=self.record["sourceRelease"], confirmed=False)
            self.service("start")
            self.readiness(self.record["sourceRelease"], probation=5)
            self.phase("rolled_back", runningVersion=self.record["sourceRelease"], confirmed=True)
            self.internal("POST", "/internal/maintenance/resume")
            (RUNTIME / "paused").unlink(missing_ok=True)
        except Exception:
            self.persist(phase="recovery_required", failureCode="RECOVERY_REQUIRED")

    def recover(self):
        if self.corrupt:
            (RUNTIME / "paused").touch(mode=0o644)
            return
        self.busy = True
        try:
            with exclusive(self.state / "installation.lock"):
                if self.record.get("phase") in ACTIVATED and not self.record.get("confirmed"):
                    self.rollback("INTERRUPTED")
                else:
                    # A confirmed candidate survives power loss; incomplete preparation never activates.
                    if self.record.get("confirmed") and self.record.get("phase") == "checking":
                        self.persist(phase="completed", failureCode=None)
                    if self.record.get("phase") not in TERMINAL:
                        candidate = self.release_path(self.record["targetRelease"]) if self.record.get("targetRelease") else None
                        if candidate and candidate.exists() and self.record["targetRelease"] != self.record["selectedRelease"] and not (candidate / "verified.json").exists():
                            shutil.rmtree(candidate)
                        self.phase("failed", failureCode="INTERRUPTED")
                    if self.record.get("phase") == "recovery_required":
                        (RUNTIME / "paused").touch(mode=0o644)
                        return
                    self.select(self.record["selectedRelease"])
                    (RUNTIME / "paused").touch(mode=0o644)
                    self.service("start")
                    self.readiness(self.record["selectedRelease"], probation=5)
                    self.internal("POST", "/internal/maintenance/resume")
                    (RUNTIME / "paused").unlink(missing_ok=True)
        except Exception:
            self.persist(phase="recovery_required", failureCode="RECOVERY_REQUIRED")
        finally:
            self.busy = False
            self.startup_report()

    def offline_restore(self, envelope):
        with self.mutex:
            grant = self.recovery_authorization(envelope)
            if self.busy or self.corrupt or grant.get("release") != self.record.get("sourceRelease") or not self.record.get("snapshot"):
                raise MaintenanceError("RECOVERY_REQUIRED")
            uuid.UUID(grant["nonce"])
            used = self.state / "recovery" / f"{grant['nonce']}.json"
            if used.exists():
                raise MaintenanceError("ACCESS_DENIED", 403)
            write_json(used, {"usedAt": int(time.time())})
            self.persist(jobId=grant["nonce"], sourceRelease=grant["release"], targetRelease=grant["release"], phase="rolling_back", sequence=0, localOnly=True, operation="recovery", confirmed=False)
            self.busy = True
            def restore():
                try:
                    with exclusive(self.state / "installation.lock"):
                        self.rollback("INTERRUPTED")
                finally:
                    self.busy = False
                    self.startup_report()
            threading.Thread(target=restore, daemon=False).start()
            return {"accepted": True}

    def recovery_authorization(self, envelope):
        trusted_time()
        grant, _ = verify_envelope(envelope, CONFIG / "trusted-job-keys")
        metadata, installation = self.identity()
        if grant.get("purpose") != "recovery" or grant.get("installationId") != installation or grant.get("controllerDeviceId") != metadata.get("controllerDevice", {}).get("id") or not grant["issuedAt"] <= time.time() <= grant["expiresAt"] or grant["expiresAt"] - grant["issuedAt"] > 86400 or grant.get("release") not in (self.record.get("sourceRelease"), self.record.get("selectedRelease")):
            raise MaintenanceError("ACCESS_DENIED", 403)
        return grant
