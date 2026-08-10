"use client";

const PERIOD_OPTIONS = ["1mo", "3mo", "6mo", "1y", "2y"];

export default function Sidebar({
  ticker,
  onTickerChange,
  sectorOptions,
  sector,
  onSectorChange,
  yahooHint,
  loadingSectors,
  peerCount,
  onPeerCountChange,
  period,
  onPeriodChange,
  onRun,
  running,
}: {
  ticker: string;
  onTickerChange: (value: string) => void;
  sectorOptions: string[];
  sector: string | null;
  onSectorChange: (value: string) => void;
  yahooHint: string | null;
  loadingSectors: boolean;
  peerCount: number;
  onPeerCountChange: (value: number) => void;
  period: string;
  onPeriodChange: (value: string) => void;
  onRun: () => void;
  running: boolean;
}) {
  return (
    <aside className="sidebar">
      <h2>Configuration</h2>

      <div className="field">
        <label htmlFor="ticker">Stock ticker</label>
        <input
          id="ticker"
          type="text"
          value={ticker}
          onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
        />
      </div>

      {loadingSectors && <div className="field hint">Resolving sectors...</div>}

      {!loadingSectors && sectorOptions.length > 0 && (
        <div className="field">
          <label htmlFor="sector">Sector group to analyze against</label>
          <select
            id="sector"
            value={sector ?? ""}
            onChange={(e) => onSectorChange(e.target.value)}
          >
            {sectorOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {sectorOptions.length > 1 && (
            <div className="hint">
              This ticker sits in more than one group — pick which peer set to run against.
            </div>
          )}
        </div>
      )}

      {!loadingSectors && sectorOptions.length === 0 && ticker && (
        <div className="field hint">
          AI couldn&apos;t classify {ticker} into a sector yet
          {yahooHint ? ` (Yahoo sector: ${yahooHint})` : ""}.
        </div>
      )}

      {sector && (
        <div className="field">
          <label htmlFor="peerCount">Peers to compare: {peerCount}</label>
          <input
            id="peerCount"
            type="range"
            min={2}
            max={20}
            value={peerCount}
            onChange={(e) => onPeerCountChange(Number(e.target.value))}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="period">History window</label>
        <select id="period" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
          {PERIOD_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <button className="run-button" onClick={onRun} disabled={running || !ticker}>
        {running ? "Running..." : "Run Analysis"}
      </button>
    </aside>
  );
}
