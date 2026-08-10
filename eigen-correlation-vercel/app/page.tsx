"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import RelationshipTable from "@/components/RelationshipTable";
import CorrelationHeatmap from "@/components/CorrelationHeatmap";
import PriceChart from "@/components/PriceChart";
import KeyFindings from "@/components/KeyFindings";
import CapTierTable from "@/components/CapTierTable";
import LoadingsTable from "@/components/LoadingsTable";
import AIExplanation from "@/components/AIExplanation";
import {
  AnalyzeResponse,
  ApiError,
  PeersResponse,
  SectorsResponse,
} from "@/lib/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as ApiError).error || `Request to ${url} failed`);
  }
  return data as T;
}

export default function Home() {
  const [ticker, setTicker] = useState("NVDA");
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);
  const [yahooHint, setYahooHint] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [loadingSectors, setLoadingSectors] = useState(false);

  const [peerCount, setPeerCount] = useState(10);
  const [period, setPeriod] = useState("6mo");

  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [analyzed, setAnalyzed] = useState<{ ticker: string; sector: string } | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null);
  const [writeup, setWriteup] = useState<string | null>(null);
  const [loadingWriteup, setLoadingWriteup] = useState(false);

  // Resolve sectors whenever the ticker changes, debounced — mirrors the
  // original app's cached_identify_sectors call driven by the sidebar input.
  useEffect(() => {
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) {
      setSectorOptions([]);
      setSector(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSectors(true);
      try {
        const data = await postJson<SectorsResponse>("/api/sectors", { ticker: cleanTicker });
        setSectorOptions(data.sectors);
        setYahooHint(data.yahoo_hint);
        setSector(data.sectors[0] ?? null);
      } catch {
        setSectorOptions([]);
        setYahooHint(null);
        setSector(null);
      } finally {
        setLoadingSectors(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [ticker]);

  async function handleRun() {
    setError(null);
    setAnalyzeResult(null);
    setWriteup(null);
    setAnalyzed(null);

    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) return;

    if (!sector) {
      setError(
        yahooHint
          ? `${cleanTicker} maps to Yahoo sector '${yahooHint}', but the AI layer couldn't build a peer group for it — try again or try a different ticker.`
          : `Couldn't resolve a sector for ${cleanTicker}. Try a different ticker.`,
      );
      return;
    }

    setRunning(true);
    try {
      setStep(`AI is proposing peer stocks for '${sector}'...`);
      const peersData = await postJson<PeersResponse>("/api/peers", {
        sector,
        exclude_ticker: cleanTicker,
        limit: 20,
      });

      if (peersData.ranked.length === 0) {
        setError(
          `AI couldn't build a peer list for '${sector}' — try a different sector, or a different ticker.`,
        );
        return;
      }

      const peers = Object.fromEntries(peersData.ranked.slice(0, peerCount));

      setStep(`Fetching ${period} price history for ${Object.keys(peers).length + 1} tickers...`);
      const analysis = await postJson<AnalyzeResponse>("/api/analyze", {
        ticker: cleanTicker,
        peers,
        period,
      });

      setAnalyzeResult(analysis);
      setAnalyzed({ ticker: cleanTicker, sector });
      setStep(null);

      setLoadingWriteup(true);
      const explained = await postJson<{ writeup: string }>("/api/explain", {
        ticker: cleanTicker,
        sector,
        moves_with: analysis.moves_with,
        moves_against: analysis.moves_against,
        no_relationship: analysis.no_relationship,
        dominant_ticker: analysis.dominant_ticker,
        explained_pct_top: analysis.explained_variance_pct[0],
        trend_stats: analysis.trend_stats,
      });
      setWriteup(explained.writeup);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      setStep(null);
      setLoadingWriteup(false);
    }
  }

  return (
    <div className="layout">
      <Sidebar
        ticker={ticker}
        onTickerChange={setTicker}
        sectorOptions={sectorOptions}
        sector={sector}
        onSectorChange={setSector}
        yahooHint={yahooHint}
        loadingSectors={loadingSectors}
        peerCount={peerCount}
        onPeerCountChange={setPeerCount}
        period={period}
        onPeriodChange={setPeriod}
        onRun={handleRun}
        running={running}
      />

      <main className="main">
        <h1>📊 Sector Eigen-Correlation Explorer</h1>
        <p className="caption">
          Pick a stock → AI finds its sector peers → the question this answers: if this stock
          moves, does the rest of the group move with it — yes or no?
        </p>

        {step && <p className="status-line">{step}</p>}
        {error && <div className="error-box">{error}</div>}

        {!analyzeResult && !error && !running && (
          <div className="info-box">Enter a ticker in the sidebar and click Run Analysis to begin.</div>
        )}

        {analyzeResult && analyzed && (
          <>
            <section className="panel">
              <h3>
                🔗 Does the rest of the group move with {analyzed.ticker}?
              </h3>
              <RelationshipTable rows={analyzeResult.relationship_table} />
            </section>

            <section className="panel results-grid">
              <div>
                <h3>Correlation Matrix</h3>
                <CorrelationHeatmap
                  tickers={analyzeResult.tickers}
                  matrix={analyzeResult.correlation_matrix}
                />

                <h3 style={{ marginTop: 24 }}>Price History (normalized to 100 at start)</h3>
                <PriceChart dates={analyzeResult.dates} normalized={analyzeResult.normalized_prices} />
              </div>

              <div>
                <h3>Key Findings</h3>
                <KeyFindings
                  dominantTicker={analyzeResult.dominant_ticker}
                  explainedPctTop={analyzeResult.explained_variance_pct[0]}
                  structureLabel={analyzeResult.structure_label}
                  signalLabel={analyzeResult.signal_label}
                />

                <h3 style={{ marginTop: 24 }}>Market Cap Tiers</h3>
                <CapTierTable capTiers={analyzeResult.cap_tiers} />

                <h3 style={{ marginTop: 24 }}>Top Component Loadings</h3>
                <LoadingsTable loadings={analyzeResult.top_component_loadings} />
              </div>
            </section>

            <section className="panel">
              <h3>🧠 AI Explanation</h3>
              <AIExplanation writeup={writeup} loading={loadingWriteup} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
