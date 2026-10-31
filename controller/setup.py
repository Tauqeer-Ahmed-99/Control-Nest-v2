"""Pair this Pi without putting the controller API key in shell history."""
import asyncio
import getpass
import re

from services.api import APIService
from services.controller_config import ControllerConfigService
from services.controller_device import ControllerDevice
from services.cloudflared import CloudflaredService
from services.system import SystemService


async def main():
    print("Control Nest · Connect this Raspberry Pi")
    print("On the website, open My houses, select your house, and add a controller.")
    key = getpass.getpass("Paste this controller's API key (hidden): ").strip()
    if not re.fullmatch(r"cn_[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}", key):
        raise ValueError("That does not look like a controller API key. Copy the complete key from the website.")
    config = ControllerConfigService()
    api = APIService()
    system = SystemService(config, api, CloudflaredService(), ControllerDevice(config, api))
    result = await system.config(key)
    print(f"Connected {result['controllerDevice']['name']} to {result['house']['name']}.")
    print("Sign in to the mobile app with the same email to add rooms and devices.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as error:
        from models.api import APIError
        print(error.message if isinstance(error, APIError) else "Setup failed. Check your key, server settings, and internet connection, then retry.")
        raise SystemExit(1) from None
