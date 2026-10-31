# Controller agent instructions

## Quick clean for first use

Use this only for a requested Pi cleanup/reset. Remove the old installation and pairing state; leave SSH, the OS, unrelated files, and installed prerequisites intact. Do not run install, update, or setup afterward unless requested. This does not remove cloud-side controller records or tunnels.

Confirmed on 2026-11-01: SSH user/host `wafa@rpi.local`; source copies were `Control-Nest-v2`, `Control-Nest-v2-repo`, `autopi-hub`, and `server-recent` under `/home/wafa`. All four were removed. Recheck what exists before another cleanup; do not assume `server-recent` still belongs to this project. Use private secret input if SSH needs a password; never put credentials in commands, logs, or this repository.

### Connect and inspect

Run the remaining commands on the Pi, outside the directories being deleted:

```bash
ssh -o ConnectTimeout=8 wafa@rpi.local
cd /home/wafa
sudo -v
systemctl show autopihub.service --property=WorkingDirectory,ActiveState,UnitFileState
ls -ld -- /home/wafa/Control-Nest-v2 /home/wafa/Control-Nest-v2-repo \
  /home/wafa/autopi-hub /home/wafa/server-recent /var/lib/autopihub /etc/cloudflared
```

Confirm each source directory belongs to Control Nest/AutoPiHub and resolves to the exact path below, with no symlinks or mounted subdirectories. The observed `APP_PERSISTENT_STORAGE_PATH` was `/var/lib/autopihub`; check that setting in the installed controller's `.env` without printing other values. That directory contains pairing metadata, installation identity, and request history.

The observed tunnel used `/etc/cloudflared/token`. Confirm it belongs to AutoPiHub without displaying either token:

```bash
sudo python3 - <<'PY'
import json
from pathlib import Path
stored = json.loads(Path('/var/lib/autopihub/stores/controller_metadata.json').read_text())['tunnel']['token']
active = Path('/etc/cloudflared/token').read_text().strip()
assert stored and stored == active, 'Tunnel ownership not confirmed'
print('AutoPiHub tunnel confirmed')
PY
```

If either file is missing or the check fails, investigate first; omit all Cloudflare service/configuration removal until ownership is confirmed. Do not print `systemctl cat cloudflared` or full process arguments: they can contain a tunnel token.

### Stop and remove

These commands cover the confirmed installation. Omit units already absent on a repeat cleanup. Before deleting files, verify services are inactive and no separate process is running from an old project directory; do not ignore stop failures.

```bash
sudo systemctl stop autopihub.service cloudflared.service cloudflared-update.service cloudflared-update.timer
sudo systemctl disable autopihub.service cloudflared.service cloudflared-update.timer
systemctl show autopihub.service cloudflared.service cloudflared-update.service cloudflared-update.timer --property=Id,ActiveState

sudo rm -f -- /etc/systemd/system/autopihub.service \
  /etc/systemd/system/cloudflared.service /etc/systemd/system/cloudflared-update.service \
  /etc/systemd/system/cloudflared-update.timer /etc/sudoers.d/cloudflared
sudo rm -rf -- /home/wafa/Control-Nest-v2 /home/wafa/Control-Nest-v2-repo \
  /home/wafa/autopi-hub /home/wafa/server-recent /var/lib/autopihub /etc/cloudflared
sudo systemctl daemon-reload
```

### Verify and stop here

```bash
systemctl show autopihub.service cloudflared.service cloudflared-update.service cloudflared-update.timer --property=Id,LoadState,ActiveState
pgrep -x cloudflared
ss -ltn
systemctl is-active ssh
command -v curl tar python3 cloudflared
dpkg-query -W '-f=${Package}: ${Status}\n' python3-venv python3-pip ca-certificates
```

Expect removed units to be `LoadState=not-found` and `ActiveState=inactive`, no tunnel PID (`pgrep` exits 1), and no controller/tunnel listeners on ports 8000/20241. Confirm the deleted paths are absent and no separate process is running from an old project directory. SSH should remain active; keep `curl`, `tar`, Python/venv/pip, certificates, and the unconfigured `cloudflared` package for a future install. Leave the Pi uninstalled and unpaired.
