export default function KeyFindings({
  dominantTicker,
  explainedPctTop,
  structureLabel,
  signalLabel,
}: {
  dominantTicker: string;
  explainedPctTop: number;
  structureLabel: string;
  signalLabel: string;
}) {
  return (
    <div>
      <div className="metric-row">
        <div className="metric-card">
          <div className="label">Dominant driver</div>
          <div className="value">{dominantTicker}</div>
        </div>
        <div className="metric-card">
          <div className="label">Top component variance</div>
          <div className="value">{explainedPctTop.toFixed(1)}%</div>
        </div>
      </div>
      <p>
        <strong>Structure:</strong> {structureLabel}
      </p>
      <p>
        <strong>Signal:</strong> {signalLabel}
      </p>
    </div>
  );
}
