interface CharacterRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}

export default function CharacterRing({
  value,
  max,
  size = 28,
  strokeWidth = 2.5,
}: CharacterRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const dashOffset = circumference * (1 - pct);

  // Color transitions: muted → accent → warning → danger
  const getColor = () => {
    if (pct < 0.7) return "hsl(var(--border))";
    if (pct < 0.85) return "hsl(var(--accent))";
    if (pct < 0.95) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const remaining = max - value;
  const showCount = pct > 0.7;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border-subtle))"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 150ms ease, stroke 150ms ease" }}
        />
      </svg>
      {showCount && (
        <span
          className="absolute text-[9px] font-semibold tabular-nums"
          style={{ color: getColor(), transition: "color 150ms ease" }}
        >
          {remaining < 0 ? `-${Math.abs(remaining)}` : remaining}
        </span>
      )}
    </div>
  );
}
