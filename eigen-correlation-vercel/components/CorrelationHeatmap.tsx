import Plot from "./Plot";

export default function CorrelationHeatmap({
  tickers,
  matrix,
}: {
  tickers: string[];
  matrix: Record<string, Record<string, number>>;
}) {
  const z = tickers.map((row) => tickers.map((col) => matrix[row]?.[col] ?? null));
  const text = z.map((row) => row.map((v) => (v === null ? "" : v.toFixed(2))));

  return (
    <Plot
      data={[
        {
          z,
          x: tickers,
          y: tickers,
          type: "heatmap",
          colorscale: "RdBu",
          reversescale: true,
          zmin: -1,
          zmax: 1,
          text,
          texttemplate: "%{text}",
          // Plotly's TS defs only allow a flat string[] for `text`, but the
          // runtime (and Plotly.js itself) supports a 2D array per heatmap cell.
        } as any,
      ]}
      layout={{
        autosize: true,
        margin: { l: 60, r: 20, t: 20, b: 60 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#e6e6f0" },
      }}
      style={{ width: "100%", height: "420px" }}
      useResizeHandler
      config={{ displayModeBar: false }}
    />
  );
}
