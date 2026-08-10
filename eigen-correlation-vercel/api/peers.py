import sys
import os

sys.path.append(os.path.dirname(__file__))

from http.server import BaseHTTPRequestHandler

from _core.ai_discovery import propose_sector_stocks
from _core.data_fetcher import validate_and_rank_candidates
from _core.http_utils import read_json_body, send_json, send_error_json


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            body = read_json_body(self)
            sector = (body.get("sector") or "").strip()
            exclude_ticker = (body.get("exclude_ticker") or "").upper().strip()
            limit = int(body.get("limit") or 20)

            if not sector or not exclude_ticker:
                send_error_json(self, 400, "sector and exclude_ticker are required")
                return

            candidates = propose_sector_stocks(sector, exclude_ticker=exclude_ticker, limit=limit)
            if not candidates:
                send_json(self, 200, {"ranked": []})
                return

            ranked = validate_and_rank_candidates(candidates, exclude=exclude_ticker, limit=limit)
            send_json(self, 200, {"ranked": ranked})
        except Exception as e:
            send_error_json(self, 500, str(e))
