import sys
import os

sys.path.append(os.path.dirname(__file__))

from http.server import BaseHTTPRequestHandler

from _core.data_fetcher import fetch_price_history, fetch_market_caps, cap_tier
from _core.pca_engine import (
    run_pca,
    signal_strength_label,
    correlation_structure_label,
    relationship_table,
)
from _core.http_utils import read_json_body, send_json, send_error_json


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            body = read_json_body(self)
            ticker = (body.get("ticker") or "").upper().strip()
            peers = body.get("peers") or {}  # {ticker: market_cap}
            period = body.get("period") or "6mo"

            if not ticker or not peers:
                send_error_json(self, 400, "ticker and peers are required")
                return

            group_tickers = [ticker] + list(peers.keys())

            try:
                prices = fetch_price_history(group_tickers, period=period)
            except ValueError as e:
                send_error_json(self, 400, str(e))
                return

            if prices.shape[1] < 2:
                send_error_json(
                    self, 400,
                    "Not enough tickers returned valid price data to run correlation analysis.",
                )
                return

            caps = dict(peers)
            missing = [t for t in prices.columns if t not in caps]
            if missing:
                caps.update(fetch_market_caps(missing))
            cap_tiers = {
                t: {"tier": cap_tier(caps.get(t)), "market_cap": caps.get(t)}
                for t in prices.columns
            }

            result = run_pca(prices)
            trend_stats = ((prices.iloc[-1] / prices.iloc[0] - 1) * 100).to_dict()

            rel_df = relationship_table(result.correlation_matrix, ticker)
            relationship_rows = rel_df.to_dict(orient="records")
            moves_with = rel_df.loc[rel_df["Likely movement"] == "Moves with it", "Ticker"].tolist()
            moves_against = rel_df.loc[rel_df["Likely movement"] == "Moves against it", "Ticker"].tolist()
            no_relationship = rel_df.loc[rel_df["Likely movement"] == "No reliable relationship", "Ticker"].tolist()

            normalized = prices / prices.iloc[0] * 100

            send_json(self, 200, {
                "tickers": list(prices.columns),
                "dates": [d.strftime("%Y-%m-%d") for d in prices.index],
                "normalized_prices": {t: normalized[t].tolist() for t in normalized.columns},
                "correlation_matrix": result.correlation_matrix.to_dict(),
                "relationship_table": relationship_rows,
                "moves_with": moves_with,
                "moves_against": moves_against,
                "no_relationship": no_relationship,
                "dominant_ticker": result.dominant_ticker,
                "explained_variance_pct": result.explained_variance_pct.tolist(),
                "eigenvalues": result.eigenvalues.tolist(),
                "top_component_loadings": result.top_component_loadings,
                "cap_tiers": cap_tiers,
                "trend_stats": trend_stats,
                "signal_label": signal_strength_label(result.explained_variance_pct[0]),
                "structure_label": correlation_structure_label(result.eigenvalues),
            })
        except Exception as e:
            send_error_json(self, 500, str(e))
