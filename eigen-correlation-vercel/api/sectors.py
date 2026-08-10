import sys
import os

sys.path.append(os.path.dirname(__file__))

from http.server import BaseHTTPRequestHandler

from _core.ai_discovery import identify_sectors
from _core.data_fetcher import yahoo_sector_hint
from _core.http_utils import read_json_body, send_json, send_error_json


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            body = read_json_body(self)
            ticker = (body.get("ticker") or "").upper().strip()
            if not ticker:
                send_error_json(self, 400, "ticker is required")
                return

            sectors = identify_sectors(ticker)
            yahoo_hint = None if sectors else yahoo_sector_hint(ticker)

            send_json(self, 200, {"sectors": sectors, "yahoo_hint": yahoo_hint})
        except Exception as e:
            send_error_json(self, 500, str(e))
