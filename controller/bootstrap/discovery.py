"""Discovery remains available even when neither application release starts."""
import socket
import threading
from zeroconf import Zeroconf, ServiceInfo


class Discovery:
    def __init__(self, lookup):
        self.lookup = lookup
        self.lock = threading.Lock()
        self.client = None

    def refresh(self):
        with self.lock:
            try:
                data = self.lookup({"action": "discovery"})["data"]
                identity = data["installationId"]
                if not identity:
                    return
                with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as connection:
                    connection.connect(("192.0.2.1", 80))
                    address = connection.getsockname()[0]
                if self.client:
                    self.client.close()
                self.client = Zeroconf()
                service = "_autopihub._tcp.local."
                self.client.register_service(ServiceInfo(service, f"{data['name']}-{identity[:8]}.{service}", addresses=[socket.inet_aton(address)], port=8000,
                    properties={"deviceName": data["name"], "configured": str(bool(data["controllerDeviceId"])).lower(), "controllerDeviceId": str(data["controllerDeviceId"]), "hostname": str(data["hostname"])}, server=f"autopi-{identity[:8]}.local."))
            except Exception:
                pass
