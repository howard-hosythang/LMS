from __future__ import annotations

import argparse
import socket
import time


def wait_for(host: str, port: int, timeout_seconds: int) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        try:
            sock.connect((host, port))
            return
        except OSError:
            time.sleep(1)
        finally:
            sock.close()

    raise TimeoutError(f"Timeout waiting for {host}:{port}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Wait until a TCP host:port is reachable")
    parser.add_argument("--host", required=True)
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--timeout", type=int, default=90)
    args = parser.parse_args()

    wait_for(args.host, args.port, args.timeout)
    print(f"{args.host}:{args.port} is reachable")


if __name__ == "__main__":
    main()
