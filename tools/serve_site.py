"""Threaded local static server. Always serves the repo root (not the process cwd).

By default the process detaches from the launching shell. Cursor agent shells
run inside a Windows job that kills children when the shell exits; a second
listener used to stack on 8765 because Python sets SO_REUSEADDR. This module
binds exclusively, reuses a healthy singleton, and replaces only a dead or
stacked listener on the requested port.

Use --foreground to stay attached to this process.
"""
from __future__ import annotations

import argparse
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
HEALTH_PATH = "/index.html"

CREATE_NEW_PROCESS_GROUP = 0x00000200
DETACHED_PROCESS = 0x00000008
CREATE_BREAKAWAY_FROM_JOB = 0x01000000
CREATE_NO_WINDOW = 0x08000000
WIN_EADDRINUSE = 10048


class ExclusiveThreadingHTTPServer(ThreadingHTTPServer):
    """Refuse a second bind on the same host:port.

    Python's HTTPServer sets SO_REUSEADDR. On Windows that lets extra
    processes stack on 8765; Chrome then gets ERR_EMPTY_RESPONSE.
    """

    allow_reuse_address = False
    allow_reuse_port = False

    def server_bind(self) -> None:
        if sys.platform == "win32":
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def _health_url(host: str, port: int) -> str:
    return "http://{host}:{port}{path}".format(host=host, port=port, path=HEALTH_PATH)


def is_healthy(host: str, port: int) -> bool:
    try:
        with urllib.request.urlopen(_health_url(host, port), timeout=2) as resp:
            return 200 <= getattr(resp, "status", 200) < 400
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def _pid_path(port: int) -> Path:
    if port == DEFAULT_PORT:
        return ROOT / "tools" / ".serve_site.pid"
    return ROOT / "tools" / ".serve_site.{port}.pid".format(port=port)


def _log_path() -> Path:
    return ROOT / "tools" / ".serve_site.log"


def _read_pid(port: int) -> int | None:
    try:
        text = _pid_path(port).read_text(encoding="utf-8").strip().split()
        return int(text[0])
    except (OSError, ValueError, IndexError):
        return None


def _write_pid(port: int, pid: int) -> None:
    path = _pid_path(port)
    path.write_text("{pid}\n".format(pid=pid), encoding="utf-8")


def _clear_pid(port: int, only_pid: int | None = None) -> None:
    if only_pid is not None and _read_pid(port) != only_pid:
        return
    try:
        _pid_path(port).unlink()
    except OSError:
        pass


def _pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    if sys.platform == "win32":
        import ctypes

        # os.kill(pid, 0) is not an existence check on Windows (WinError 87).
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.OpenProcess(0x1000, False, pid)
        if handle:
            kernel32.CloseHandle(handle)
            return True
        return kernel32.GetLastError() == 5
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except OSError:
        return False
    return True


class _PidProc:
    """Stand-in when WMI creates the server (no Popen handle)."""

    def __init__(self, pid: int) -> None:
        self.pid = pid

    def poll(self) -> int | None:
        return None if _pid_alive(self.pid) else 1


def _attach_log_stdio() -> None:
    """A WMI / windowless process has no console; writing stdout would exit."""
    try:
        if sys.stdout is not None and not getattr(sys.stdout, "closed", False):
            sys.stdout.write("")
            return
    except OSError:
        pass
    log_f = open(_log_path(), "a", encoding="utf-8")
    sys.stdout = log_f
    sys.stderr = log_f


def _spawn_via_wmi(cmd: list[str], cwd: str) -> _PidProc:
    """Create the process from the WMI service so it is not in the Cursor job."""
    cmd_line = subprocess.list2cmdline(cmd)
    ps = (
        "$startup = ([wmiclass]'Win32_ProcessStartup').CreateInstance(); "
        "$startup.ShowWindow = 0; "
        "$r = ([wmiclass]'Win32_Process').Create('{cmd}', '{cwd}', $startup); "
        "if ($null -eq $r -or $r.ReturnValue -ne 0) {{"
        " Write-Error ('WMI Create failed: ' + $(if ($r) {{ $r.ReturnValue }} else {{ 'null' }})); exit 1"
        "}}; Write-Output $r.ProcessId"
    ).format(cmd=cmd_line.replace("'", "''"), cwd=cwd.replace("'", "''"))
    out = subprocess.check_output(
        ["powershell", "-NoProfile", "-Command", ps],
        text=True,
        creationflags=CREATE_NO_WINDOW,
    )
    pid = int(out.strip().splitlines()[-1])
    return _PidProc(pid)


def _local_port(addr: str) -> int | None:
    if addr.startswith("["):
        try:
            return int(addr.rsplit("]:", 1)[1])
        except (IndexError, ValueError):
            return None
    try:
        return int(addr.rsplit(":", 1)[1])
    except (IndexError, ValueError):
        return None


def listeners_on_port(port: int) -> list[int]:
    """PIDs in LISTEN state on TCP *port* (any local address)."""
    if sys.platform != "win32":
        return _listeners_on_port_posix(port)
    try:
        out = subprocess.check_output(
            ["netstat", "-ano", "-p", "TCP"],
            text=True,
            errors="replace",
            creationflags=CREATE_NO_WINDOW,
        )
    except OSError:
        return []
    pids: set[int] = set()
    for raw in out.splitlines():
        parts = raw.split()
        if len(parts) < 5 or parts[0].upper() != "TCP":
            continue
        if parts[3].upper() != "LISTENING":
            continue
        if _local_port(parts[1]) != port:
            continue
        try:
            pid = int(parts[-1])
        except ValueError:
            continue
        if pid > 0:
            pids.add(pid)
    return sorted(pids)


def _listeners_on_port_posix(port: int) -> list[int]:
    try:
        out = subprocess.check_output(
            ["ss", "-lptn", "sport = :{port}".format(port=port)],
            text=True,
            errors="replace",
        )
    except OSError:
        return []
    pids: set[int] = set()
    for raw in out.splitlines():
        marker = "pid="
        at = raw.find(marker)
        if at < 0:
            continue
        chunk = raw[at + len(marker) :].split(",")[0].split(")")[0]
        try:
            pid = int(chunk)
        except ValueError:
            continue
        if pid > 0:
            pids.add(pid)
    return sorted(pids)


def _kill_pid(pid: int) -> bool:
    if pid <= 0 or pid == os.getpid():
        return False
    if sys.platform == "win32":
        result = subprocess.run(
            ["taskkill", "/PID", str(pid), "/F"],
            capture_output=True,
            text=True,
            errors="replace",
            creationflags=CREATE_NO_WINDOW,
        )
        return result.returncode == 0
    try:
        os.kill(pid, 15)
    except OSError:
        return False
    return True


def reclaim_dead_listeners(host: str, port: int) -> list[int]:
    """Kill ONLY listeners on *port* when stacked or not answering HTTP.

    A healthy singleton is left alone. The pid file is used to drop a stale
    record; that pid is killed only if it is actually listening on *port*.
    """
    pids = listeners_on_port(port)
    healthy = is_healthy(host, port)
    if healthy and len(pids) <= 1:
        return []

    recorded = _read_pid(port)
    targets = set(pids)
    if recorded and recorded in pids:
        targets.add(recorded)

    killed: list[int] = []
    for pid in sorted(targets):
        if pid == os.getpid():
            continue
        if pid not in pids:
            continue
        if _kill_pid(pid):
            killed.append(pid)

    _clear_pid(port)
    deadline = time.time() + 3
    while time.time() < deadline and listeners_on_port(port):
        time.sleep(0.1)
    return killed


def _remember_running_pid(port: int, pids: list[int]) -> int | None:
    pid = _read_pid(port)
    if pid and pid in pids and _pid_alive(pid):
        return pid
    if len(pids) == 1:
        _write_pid(port, pids[0])
        return pids[0]
    return pid if pid and _pid_alive(pid) else None


def already_running(host: str, port: int) -> bool:
    pids = listeners_on_port(port)
    if not (is_healthy(host, port) and len(pids) <= 1):
        return False
    pid = _remember_running_pid(port, pids)
    if pid:
        sys.stdout.write(
            "already running: http://{host}:{port}/ (pid {pid})\n".format(
                host=host, port=port, pid=pid
            )
        )
    else:
        sys.stdout.write(
            "already running: http://{host}:{port}/\n".format(host=host, port=port)
        )
    sys.stdout.flush()
    return True


def _spawn_detached(host: str, port: int) -> subprocess.Popen | _PidProc:
    script = str(Path(__file__).resolve())
    cmd = [sys.executable, "-u", script, "--foreground", "--host", host, "--port", str(port)]
    log_path = _log_path()
    log_f = open(log_path, "a", encoding="utf-8")
    log_f.write("\n--- detach {ts} ---\n".format(ts=time.strftime("%Y-%m-%d %H:%M:%S")))
    log_f.flush()
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    if sys.platform == "win32":
        try:
            proc = _spawn_via_wmi(cmd, str(ROOT))
            log_f.write("WMI pid {pid}\n".format(pid=proc.pid))
            log_f.flush()
            log_f.close()
            return proc
        except (OSError, subprocess.CalledProcessError, ValueError) as err:
            log_f.write("WMI spawn failed ({err}); falling back to CreateProcess\n".format(err=err))
            log_f.flush()
        attempts = (
            CREATE_BREAKAWAY_FROM_JOB | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW,
            DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW,
        )
        last_err: OSError | None = None
        for flags in attempts:
            try:
                proc = subprocess.Popen(
                    cmd,
                    stdin=subprocess.DEVNULL,
                    stdout=log_f,
                    stderr=subprocess.STDOUT,
                    cwd=str(ROOT),
                    env=env,
                    creationflags=flags,
                )
                log_f.close()
                return proc
            except OSError as err:
                last_err = err
        log_f.close()
        raise last_err or OSError("could not spawn detached server")
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.DEVNULL,
        stdout=log_f,
        stderr=subprocess.STDOUT,
        cwd=str(ROOT),
        env=env,
        start_new_session=True,
    )
    log_f.close()
    return proc


def detach(host: str, port: int) -> int:
    if already_running(host, port):
        return 0
    killed = reclaim_dead_listeners(host, port)
    if killed:
        sys.stdout.write(
            "Replaced dead/stacked listener(s) on port {port}: {pids}\n".format(
                port=port, pids=", ".join(str(pid) for pid in killed)
            )
        )
        sys.stdout.flush()
    if already_running(host, port):
        return 0
    try:
        proc = _spawn_detached(host, port)
    except OSError as err:
        sys.stderr.write("Could not start detached server ({err}).\n".format(err=err))
        return 1
    _write_pid(port, proc.pid)
    child_gone = False
    for _ in range(50):
        if is_healthy(host, port) and len(listeners_on_port(port)) <= 1:
            live = listeners_on_port(port)
            shown = live[0] if live else proc.pid
            if shown != proc.pid:
                _write_pid(port, shown)
            sys.stdout.write(
                "Serving {root} at http://{host}:{port}/ (detached pid {pid})\n".format(
                    root=ROOT, host=host, port=port, pid=shown
                )
            )
            sys.stdout.flush()
            return 0
        if proc.poll() is not None:
            child_gone = True
            break
        time.sleep(0.15)
    # A racing starter may win the exclusive bind; treat that as success.
    for _ in range(15):
        if already_running(host, port):
            return 0
        if not child_gone and proc.poll() is None:
            break
        time.sleep(0.15)
    if child_gone:
        sys.stderr.write(
            "Detached server exited before binding http://{host}:{port}/. See {log}.\n".format(
                host=host, port=port, log=_log_path()
            )
        )
        _clear_pid(port, only_pid=proc.pid)
        return 1
    if already_running(host, port):
        return 0
    sys.stderr.write(
        "Detached server did not answer {url} in time. See {log}.\n".format(
            url=_health_url(host, port), log=_log_path()
        )
    )
    return 1


def serve_foreground(host: str, port: int) -> int:
    _attach_log_stdio()
    if already_running(host, port):
        return 0
    killed = reclaim_dead_listeners(host, port)
    if killed:
        sys.stdout.write(
            "Replaced dead/stacked listener(s) on port {port}: {pids}\n".format(
                port=port, pids=", ".join(str(pid) for pid in killed)
            )
        )
        sys.stdout.flush()
    if already_running(host, port):
        return 0

    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    try:
        httpd = ExclusiveThreadingHTTPServer((host, port), handler)
    except OSError as err:
        for _ in range(12):
            if already_running(host, port):
                return 0
            time.sleep(0.15)
        winerr = getattr(err, "winerror", None)
        extra = ""
        if winerr == WIN_EADDRINUSE or getattr(err, "errno", None) == getattr(socket, "EADDRINUSE", 98):
            extra = (
                " Port {port} is already taken (WinError 10048 / EADDRINUSE). "
                "A second BirInci preview must not stack. "
                "If the page is blank, run start-dev.bat to replace the dead listener.\n"
            ).format(port=port)
        sys.stderr.write(
            "Could not bind http://{host}:{port}/ ({err}).{extra}".format(
                host=host, port=port, err=err, extra=extra or "\n"
            )
        )
        return 1

    _write_pid(port, os.getpid())
    sys.stdout.write("Serving {root} at http://{host}:{port}/\n".format(root=ROOT, host=host, port=port))
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        _clear_pid(port, only_pid=os.getpid())
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Serve the BirInci locale trees for local preview.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument(
        "--foreground",
        action="store_true",
        help="Serve in this process. Default is to detach so agent shells cannot kill the listener.",
    )
    args = parser.parse_args(argv)
    if args.foreground:
        return serve_foreground(args.host, args.port)
    return detach(args.host, args.port)


if __name__ == "__main__":
    raise SystemExit(main())
