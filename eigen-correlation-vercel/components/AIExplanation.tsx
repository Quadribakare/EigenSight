export default function AIExplanation({ writeup, loading }: { writeup: string | null; loading: boolean }) {
  if (loading) {
    return <p className="status-line">Generating AI explanation...</p>;
  }
  if (!writeup) {
    return null;
  }
  return <div className="ai-writeup">{writeup}</div>;
}
