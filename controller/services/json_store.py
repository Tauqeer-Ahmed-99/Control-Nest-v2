import os
from pathlib import Path
from typing import Any
import json

from dotenv import load_dotenv

load_dotenv()

APP_PERSISTENT_STORAGE_PATH = os.getenv("APP_PERSISTENT_STORAGE_PATH")

if APP_PERSISTENT_STORAGE_PATH is None:
    raise Exception("APP_PERSISTENT_STORAGE_PATH not defined in .env")

STORE_BASE_PATH = f"{APP_PERSISTENT_STORAGE_PATH}/stores"


class JsonStore:
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
        file_path = Path(f"{STORE_BASE_PATH}/{file_name}.json")

        file_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with file_path.open("w", encoding="utf-8") as file:
                json.dump(data, file, indent=2)
                return True
        except FileNotFoundError:
            print(f"Error: The file at {file_path} does not exist.")
            return False
        except PermissionError:
            print("Error: No permissions to access this file.")        
            return False