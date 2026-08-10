import Plot from "./Plot";

export default function PriceChart({
  dates,
  normalized,
}: {
  dates: string[];
  normalized: Record<string, number[]>;
}) {
  const tickers = Object.keys(normalized);

  return (
    <Plot
      data={tickers.map((t) => ({
        x: dates,
        y: normalized[t],
        type: "scatter",
        mode: "lines",
        name: t,
      }))}
      layout={{
        autosize: true,
        margin: { l: 50, r: 20, t: 20, b: 40 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#e6e6f0" },
        legend: { orientation: "h" },
        xaxis: { gridcolor: "rgba(124,92,252,0.1)" },
        yaxis: { gridcolor: "rgba(124,92,252,0.1)" },
      }}
      style={{ width: "100%", height: "360px" }}
      useResizeHandler
      config={{ displayModeBar: false }}
    />
  );
}
