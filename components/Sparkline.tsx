"use client";

// Minimal inline SVG sparkline — no charting library needed for a strip
// this small. Renders a single polyline scaled to fit its box.
export function Sparkline({
  points,
  positive,
  width = 96,
  height = 32,
}: {
  points: number[];
  positive: boolean;
  width?: number;
  height?: number;
}) {
  if (points.length < 2) {
    return <svg width={width} height={height} />;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(2)} ${(height - ((p - min) / range) * height).toFixed(2)}`)
    .join(" ");
  const color = positive ? "var(--color-bull)" : "var(--color-bear)";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
}
