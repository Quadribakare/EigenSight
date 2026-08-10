export default function LoadingsTable({ loadings }: { loadings: Record<string, number> }) {
  const rows = Object.entries(loadings).sort((a, b) => b[1] - a[1]);

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Loading</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([ticker, value]) => (
          <tr key={ticker}>
            <td>{ticker}</td>
            <td>
              {value >= 0 ? "+" : ""}
              {value.toFixed(3)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
