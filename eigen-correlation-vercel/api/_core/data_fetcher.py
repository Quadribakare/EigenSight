"""
Pulls price history and live company info via yfinance.

yfinance needs no API key and has no hard rate limit like Alpha Vantage's
5-calls/minute free tier. Keyless, and doesn't fail silently when a rate
limit is hit.
"""

from concurrent.futures import ThreadPoolExecutor

import pandas as pd
import yfinance as yf


def yahoo_sector_hint(ticker: str) -> str | None:
    """
    Yahoo's own 'sector' field, used to *report* what sector an unresolved
    ticker is in — informational only, shown when AI discovery can't build
    a peer group for it.
    """
    try:
        info = yf.Ticker(ticker).info
        return info.get("sector")
    except Exception:
        return None


def fetch_price_history(tickers: list[str], period: str = "6mo") -> pd.DataFrame:
    """
    Returns a DataFrame of adjusted close prices, one column per ticker,
    for the given yfinance period string (e.g. '1mo', '3mo', '6mo', '1y').
    Tickers that fail to fetch are dropped, not silently — the caller
    should check which columns actually came back.
    """
    data = yf.download(
        tickers, period=period, auto_adjust=True, progress=False, threads=True
    )

    if data.empty:
        raise ValueError(f"No price data returned for {tickers} (period={period}).")

    # yfinance returns a MultiIndex column frame when >1 ticker, a plain
    # frame when there's exactly 1 — normalize both to ticker-per-column.
    if isinstance(data.columns, pd.MultiIndex):
        close = data["Close"]
    else:
        close = data[["Close"]]
        close.columns = tickers

    missing = [t for t in tickers if t not in close.columns or close[t].isna().all()]
    if missing:
        close = close.drop(columns=[c for c in missing if c in close.columns])

    return close.dropna(how="all")


def fetch_market_caps(tickers: list[str]) -> dict[str, float]:
    """
    Live market cap per ticker in USD, used both for big-vs-small
    classification and to rank/validate AI-proposed candidate tickers.

    Fetched concurrently (small thread pool) rather than serially — each
    call is a separate yfinance/Yahoo network round trip, and a 20-ticker
    peer list run one-at-a-time adds up fast inside a request/response
    cycle.
    """
    def _fetch_one(t: str) -> tuple[str, float | None]:
        try:
            info = yf.Ticker(t).info
            return t, info.get("marketCap")
        except Exception:
            return t, None

    with ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(_fetch_one, tickers))

    return dict(results)


def validate_and_rank_candidates(
    tickers: list[str], exclude: str, limit: int
) -> list[tuple[str, float]]:
    """
    Validates AI-proposed candidate tickers against yfinance and ranks the
    real ones by live market cap. A candidate with no market cap is treated
    as unresolvable (delisted/hallucinated/typo'd ticker) and dropped.
    Returns the top `limit` as (ticker, market_cap) pairs, highest cap first.
    """
    exclude = exclude.upper().strip()
    candidates = [t for t in tickers if t.upper().strip() != exclude]
    caps = fetch_market_caps(candidates)
    ranked = sorted(
        ((t, c) for t, c in caps.items() if c is not None),
        key=lambda pair: pair[1],
        reverse=True,
    )
    return ranked[:limit]


def cap_tier(market_cap: float | None) -> str:
    if market_cap is None:
        return "UNKNOWN"
    if market_cap >= 200_000_000_000:
        return "LARGE"
    if market_cap >= 10_000_000_000:
        return "MID"
    return "SMALL"
