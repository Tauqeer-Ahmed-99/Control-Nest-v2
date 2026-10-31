import subprocess

from models.api import APIError


class CloudflaredService:

    def initialize_cloudflared_tunnel(self, tunnel_token: str):
        self.uninstall_cloudflared_service()
        self.install_cloudflared_service(tunnel_token)


    def install_cloudflared_service(self, tunnel_token: str):
        try:
            result = subprocess.run(
                [
                    "sudo",
                    "-n",
                    "/usr/local/bin/cloudflared",
                    "service",
                    "install",
                    tunnel_token,
                ],
                capture_output=True,
                text=True,
                timeout=60,
                check=False,
            )

            if result.returncode != 0:
                raise APIError(message="Cloudflared installation failed.")

        except subprocess.TimeoutExpired as exc:
            raise APIError(
                message="Cloudflared installation timed out"
            ) from exc

        except OSError as exc:
            raise APIError(
                message="Failed to execute cloudflared."
            ) from exc

    def uninstall_cloudflared_service(self):
        try:
            result = subprocess.run(
                [
                    "sudo",
                    "-n",
                    "/usr/local/bin/cloudflared",
                    "service",
                    "uninstall",
                ],
                capture_output=True,
                text=True,
                timeout=60,
                check=False,
            )
        
            if result.returncode != 0:
                raise APIError(message="Cloudflared uninstallation failed.")
        
        except subprocess.TimeoutExpired as exc:
            raise APIError(
                message="Cloudflared uninstallation timed out"
            ) from exc
        
        except OSError as exc:
            raise APIError(
                message="Failed to execute uninstall cloudflared."
            ) from exc
