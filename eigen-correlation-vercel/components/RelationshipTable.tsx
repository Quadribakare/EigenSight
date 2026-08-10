import { RelationshipRow } from "@/lib/types";

export default function RelationshipTable({ rows }: { rows: RelationshipRow[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Correlation</th>
          <th>Relationship</th>
          <th>Likely movement</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.Ticker}>
            <td>{row.Ticker}</td>
            <td>{row.Correlation.toFixed(2)}</td>
            <td>{row.Relationship}</td>
            <td>{row["Likely movement"]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
