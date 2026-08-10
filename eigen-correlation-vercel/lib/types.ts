export interface SectorsResponse {
  sectors: string[];
  yahoo_hint: string | null;
}

export type RankedPeer = [ticker: string, marketCap: number];

export interface PeersResponse {
  ranked: RankedPeer[];
}

export interface RelationshipRow {
  Ticker: string;
  Correlation: number;
  Relationship: "Yes" | "No";
  "Likely movement": "Moves with it" | "Moves against it" | "No reliable relationship";
}

export interface CapTierEntry {
  tier: "LARGE" | "MID" | "SMALL" | "UNKNOWN";
  market_cap: number | null;
}

export interface AnalyzeResponse {
  tickers: string[];
  dates: string[];
  normalized_prices: Record<string, number[]>;
  correlation_matrix: Record<string, Record<string, number>>;
  relationship_table: RelationshipRow[];
  moves_with: string[];
  moves_against: string[];
  no_relationship: string[];
  dominant_ticker: string;
  explained_variance_pct: number[];
  eigenvalues: number[];
  top_component_loadings: Record<string, number>;
  cap_tiers: Record<string, CapTierEntry>;
  trend_stats: Record<string, number>;
  signal_label: string;
  structure_label: string;
}

export interface ExplainResponse {
  writeup: string;
}

export interface ApiError {
  error: string;
}
