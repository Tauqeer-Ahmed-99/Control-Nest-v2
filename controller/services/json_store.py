import os
from pathlib import Path
from typing import Any
import json
import tempfile
from threading import RLock
from contextlib import contextmanager

from dotenv import load_dotenv

load_dotenv()

APP_PERSISTENT_STORAGE_PATH = os.getenv("APP_PERSISTENT_STORAGE_PATH")

if APP_PERSISTENT_STORAGE_PATH is None:
    raise Exception("APP_PERSISTENT_STORAGE_PATH not defined in .env")

STORE_BASE_PATH = f"{APP_PERSISTENT_STORAGE_PATH}/stores"


class JsonStore:
    _write_lock = RLock()

    @staticmethod
    @contextmanager
    def exclusive():
        # Shared by setup and the API process. Maintenance stops both writers before snapshotting.
        with JsonStore._write_lock:
            Path(STORE_BASE_PATH).mkdir(parents=True, exist_ok=True)
            with open(Path(STORE_BASE_PATH) / ".writer.lock", "a") as lock:
                if os.name == "posix":
                    import fcntl
                    fcntl.flock(lock, fcntl.LOCK_EX)
                try:
                    yield
                finally:
                    if os.name == "posix":
                        fcntl.flock(lock, fcntl.LOCK_UN)

    @staticmethod
    def read_file(file_name: str) -> dict[str, Any]:
        file_path = Path(f"{STORE_BASE_PATH}/{file_name}.json")

        if not file_path.exists():
            return {}

        try:
            with file_path.open("r", encoding="utf-8") as file:
                return json.load(file)
        except FileNotFoundError:
            print(f"Error: The file at {file_path} does not exist.")
            return {}
        except PermissionError:
            print("Error: No permissions to access this file.")
            return {}


    @staticmethod
    def write_file(file_name: str, data: dict[str, Any]) -> bool:
        with JsonStore.exclusive():
            return JsonStore._write_file(file_name, data)

    @staticmethod
    def _write_file(file_name: str, data: dict[str, Any]) -> bool:
        file_path = Path(f"{STORE_BASE_PATH}/{file_name}.json")

        file_path.parent.mkdir(parents=True, exist_ok=True)

        descriptor, temporary = tempfile.mkstemp(dir=file_path.parent, prefix=".pending-")
        temporary_path = Path(temporary)
        try:
            os.chmod(temporary_path, 0o600)
            with os.fdopen(descriptor, "w", encoding="utf-8") as file:
                json.dump(data, file, indent=2)
                file.flush()
                os.fsync(file.fileno())
            os.replace(temporary_path, file_path)
            if os.name == "posix":
                directory = os.open(file_path.parent, os.O_RDONLY | os.O_DIRECTORY)
                try:
                    os.fsync(directory)
                finally:
                    os.close(directory)
            return True
        except OSError:
            temporary_path.unlink(missing_ok=True)
            return False
