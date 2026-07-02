"use client"

interface Segment {
  value: number
  color: string
}

interface Props {
  segments: Segment[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerSub?: string
}

export function DonutChart({
  segments,
  size = 120,
  thickness = 14,
  centerLabel,
  centerSub,
}: Props) {
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  const total = segments.reduce((s, seg) => s + seg.value, 0)

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-muted/30"
        />
        {centerLabel && (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs font-medium">
            {centerLabel}
          </text>
        )}
      </svg>
    )
  }

  let offset = 0
  const slices = segments.map((seg) => {
    const pct = seg.value / total
    const dash = pct * circumference
    const gap = circumference - dash
    const startOffset = circumference - offset * circumference
    offset += pct
    return { ...seg, dash, gap, startOffset }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={thickness}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={s.startOffset}
          strokeLinecap="butt"
        />
      ))}

      {(centerLabel || centerSub) && (
        <g style={{ transform: `rotate(90deg) translate(0, -${size}px)` }}>
          {centerLabel && (
            <text
              x={cx}
              y={centerSub ? cy - 7 : cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="15"
              fontWeight="600"
              fill="currentColor"
            >
              {centerLabel}
            </text>
          )}
          {centerSub && (
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.6"
            >
              {centerSub}
            </text>
          )}
        </g>
      )}
    </svg>
  )
}
