import ipaddress
import socket
import json

from zeroconf import ServiceInfo
from zeroconf.asyncio import AsyncZeroconf

from services.controller_config import ControllerConfigService

SERVICE_TYPE = "_autopihub._tcp.local."

def get_local_ip() -> str:
    # Prefer the address the system hostname resolves to. The default-route
    # probe below can select a different interface when the controller has
    # more than one network address (for example, Ethernet and Wi-Fi).
    try:
        hostname_addresses = socket.getaddrinfo(
            socket.gethostname(), None, socket.AF_INET, socket.SOCK_DGRAM
        )
    except socket.gaierror:
        hostname_addresses = []

    for address in hostname_addresses:
        candidate = ipaddress.IPv4Address(address[4][0])
        if (
            candidate.is_private
            and not candidate.is_loopback
            and not candidate.is_link_local
        ):
            return str(candidate)

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.connect(("192.0.2.1", 80))
        return sock.getsockname()[0]

class DiscoveryService:
    controller_config_service: ControllerConfigService

    def __init__(
        self,
        controller_config_service: ControllerConfigService,
        port: int = 8000,
    ) -> None:
        self.controller_config_service = controller_config_service
        self.device_name = controller_config_service.get_controller_device_name()
        self.port = port
        self.zeroconf: AsyncZeroconf | None = None
        self.info: ServiceInfo | None = None

    async def start(self) -> None:
        if self.zeroconf is not None:
            return

        ip = get_local_ip()

        self.info = ServiceInfo(
            type_=SERVICE_TYPE,
            name=f"{self.device_name}.{SERVICE_TYPE}",
            addresses=[socket.inet_aton(ip)],
            port=self.port,
            properties={
                b"deviceName": self.device_name.encode(),
                b"configured": str(self.controller_config_service.is_configured()).lower().encode(),
                b"controllerDeviceId": str(self.controller_config_service.controller_device_id).encode(),
                b"hostname" : str(self.controller_config_service.tunnel_hostname).encode(),
            },
            server="autopi-hub.local.",
        )

        self.zeroconf = AsyncZeroconf()

        try:
            registration = await self.zeroconf.async_register_service(
                self.info
            )
            await registration
        except Exception:
            await self.zeroconf.async_close()
            self.zeroconf = None
            self.info = None
            raise

        print(f"AutoPi-Hub is discoverable at {ip}:{self.port}")

    async def stop(self) -> None:
        if self.zeroconf is None:
            return

        try:
            await self.zeroconf.async_close()
        finally:
            self.zeroconf = None
            self.info = None
