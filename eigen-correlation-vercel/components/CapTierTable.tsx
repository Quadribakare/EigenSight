import { CapTierEntry } from "@/lib/types";

export default function CapTierTable({ capTiers }: { capTiers: Record<string, CapTierEntry> }) {
  const tickers = Object.keys(capTiers);

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Tier</th>
          <th>Market Cap ($B)</th>
        </tr>
      </thead>
      <tbody>
        {tickers.map((t) => (
          <tr key={t}>
            <td>{t}</td>
            <td>{capTiers[t].tier}</td>
            <td>
              {capTiers[t].market_cap ? (capTiers[t].market_cap! / 1e9).toFixed(1) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
