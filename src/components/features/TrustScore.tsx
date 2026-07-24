interface TrustScoreProps {
  score: number;
  showLabel?: boolean;
}

export default function TrustScore({ score, showLabel = false }: TrustScoreProps) {
  const color =
    score >= 90
      ? "#16A34A"
      : score >= 75
      ? "#2563EB"
      : score >= 60
      ? "#CA8A04"
      : "#DC2626";

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold"
      style={{ color }}
      title={`Trust score: ${score}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {showLabel && <span>{score}</span>}
    </span>
  );
}
