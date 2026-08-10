import sys
import os

sys.path.append(os.path.dirname(__file__))

from http.server import BaseHTTPRequestHandler

from _core.ai_analyst import generate_analysis
from _core.http_utils import read_json_body, send_json, send_error_json


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            body = read_json_body(self)

            writeup = generate_analysis(
                target_ticker=body.get("ticker"),
                sector=body.get("sector"),
                moves_with=body.get("moves_with") or [],
                moves_against=body.get("moves_against") or [],
                no_relationship=body.get("no_relationship") or [],
                dominant_ticker=body.get("dominant_ticker"),
                explained_pct_top=float(body.get("explained_pct_top") or 0),
                trend_stats=body.get("trend_stats"),
            )

            send_json(self, 200, {"writeup": writeup})
        except Exception as e:
            send_error_json(self, 500, str(e))
