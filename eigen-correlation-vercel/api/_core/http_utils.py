"""
Small shared helpers so each api/*.py handler stays a thin wrapper around
one _core function instead of repeating JSON request/response boilerplate.
"""

import json
import math


def read_json_body(handler) -> dict:
    length = int(handler.headers.get("Content-Length", 0))
    if length == 0:
        return {}
    raw = handler.rfile.read(length)
    return json.loads(raw) if raw else {}


def _sanitize(value):
    """Replace NaN/Infinity (valid in Python float/numpy but not JSON) with
    None so json.dumps doesn't emit invalid JSON tokens."""
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if isinstance(value, dict):
        return {k: _sanitize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_sanitize(v) for v in value]
    return value


def send_json(handler, status: int, payload: dict):
    body = json.dumps(_sanitize(payload)).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def send_error_json(handler, status: int, message: str):
    send_json(handler, status, {"error": message})
