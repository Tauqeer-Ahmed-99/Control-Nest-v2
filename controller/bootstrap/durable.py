"""Linux-only durable state. Kept outside application releases."""
import fcntl
import json
import os
import tempfile
from contextlib import contextmanager
from pathlib import Path


def sync_directory(path):
    descriptor = os.open(path, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    descriptor, temporary = tempfile.mkstemp(dir=path.parent, prefix=".pending-")
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w") as stream:
            json.dump(value, stream, separators=(",", ":"))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        sync_directory(path.parent)
    finally:
        Path(temporary).unlink(missing_ok=True)


def read_json(path, default=None):
    try:
        return json.loads(Path(path).read_text())
    except FileNotFoundError:
        return default
    # Malformed state is deliberately not treated as an empty installation.


def sync_tree(path, allow_links=False):
    for root, _, files in os.walk(path, topdown=False):
        for name in files:
            file = Path(root) / name
            if file.is_symlink():
                if allow_links:
                    continue
                raise ValueError("Links are not permitted in persistent snapshots")
            with file.open("rb") as stream:
                os.fsync(stream.fileno())
        sync_directory(root)


@contextmanager
def exclusive(path):
    with open(path, "a") as stream:
        fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            yield
        finally:
            fcntl.flock(stream, fcntl.LOCK_UN)
