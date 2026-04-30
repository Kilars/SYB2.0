import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useMemo, useState } from "react";

import CharacterPortraitDot from "./CharacterPortraitDot";

const MIN_ROUNDS = 5;
const MIN_SIZE = 22;
const MAX_SIZE = 40;
const PAD_LEFT = 56;
const PAD_RIGHT = 16;
const PAD_TOP = 24;
const PAD_BOTTOM = 64;
const BASELINE_PCT = 50;

type Props = { data: CharacterWinRate[] };

export default function MockupD_Lollipop({ data }: Props) {
  const theme = useTheme();
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width <= 0 || height <= 0) return;
      setDims((prev) => (prev?.w === width && prev?.h === height ? prev : { w: width, h: height }));
    });
    observer.observe(node);
  }, []);

  const sorted = useMemo(
    () => data.filter((s) => s.total >= MIN_ROUNDS).sort((a, b) => b.total - a.total),
    [data],
  );

  if (!sorted.length) {
    return (
      <Box sx={{ width: "100%", height: 500 }}>
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No characters with {MIN_ROUNDS}+ rounds played.
        </Typography>
      </Box>
    );
  }

  const minTotal = Math.min(...sorted.map((s) => s.total));
  const maxTotal = Math.max(...sorted.map((s) => s.total));
  const totalRange = maxTotal - minTotal || 1;

  return (
    <Box ref={containerRef} sx={{ width: "100%", height: 520 }}>
      {dims && (
        <svg width={dims.w} height={dims.h}>
          {[0, 25, 50, 75, 100].map((pct) => {
            const plotH = dims.h - PAD_TOP - PAD_BOTTOM;
            const y = PAD_TOP + plotH - (pct / 100) * plotH;
            return (
              <g key={pct}>
                <line
                  x1={PAD_LEFT}
                  x2={dims.w - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke={pct === BASELINE_PCT ? theme.palette.warning.main : theme.palette.divider}
                  strokeDasharray={pct === BASELINE_PCT ? "5 4" : "3 3"}
                  opacity={pct === BASELINE_PCT ? 0.6 : 0.4}
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill={theme.palette.text.secondary}
                >
                  {pct}%
                </text>
              </g>
            );
          })}
          <text
            x={16}
            y={PAD_TOP + (dims.h - PAD_TOP - PAD_BOTTOM) / 2}
            transform={`rotate(-90, 16, ${PAD_TOP + (dims.h - PAD_TOP - PAD_BOTTOM) / 2})`}
            textAnchor="middle"
            fontSize={12}
            fill={theme.palette.text.secondary}
          >
            Win Rate
          </text>
          <text
            x={dims.w / 2}
            y={dims.h - 8}
            textAnchor="middle"
            fontSize={11}
            fill={theme.palette.text.secondary}
          >
            ← Most played            Least played →
          </text>
          {sorted.map((c, i) => {
            const plotW = dims.w - PAD_LEFT - PAD_RIGHT;
            const plotH = dims.h - PAD_TOP - PAD_BOTTOM;
            const cx =
              sorted.length === 1
                ? PAD_LEFT + plotW / 2
                : PAD_LEFT + (i / (sorted.length - 1)) * plotW;
            const cy = PAD_TOP + plotH - (c.winRate / 100) * plotH;
            const baselineY = PAD_TOP + plotH - (BASELINE_PCT / 100) * plotH;
            const sizeNorm = (c.total - minTotal) / totalRange;
            const size = MIN_SIZE + sizeNorm * (MAX_SIZE - MIN_SIZE);
            const above = c.winRate >= BASELINE_PCT;
            const stroke = above ? theme.palette.success.main : theme.palette.error.main;
            const isHovered = hovered === c.characterId;
            return (
              <g
                key={c.characterId}
                onMouseEnter={() => setHovered(c.characterId)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <line
                  x1={cx}
                  x2={cx}
                  y1={baselineY}
                  y2={cy}
                  stroke={stroke}
                  strokeWidth={2}
                  opacity={0.7}
                />
                <CharacterPortraitDot
                  cx={cx}
                  cy={cy}
                  size={size}
                  imageUrl={c.imageUrl}
                  name={c.name}
                  uid="ll"
                />
                {isHovered && (
                  <g>
                    <rect
                      x={cx - 60}
                      y={cy - size / 2 - 44}
                      width={120}
                      height={36}
                      rx={4}
                      fill={theme.palette.background.paper}
                      stroke={theme.palette.divider}
                    />
                    <text
                      x={cx}
                      y={cy - size / 2 - 28}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight="bold"
                      fill={theme.palette.text.primary}
                    >
                      {c.name}
                    </text>
                    <text
                      x={cx}
                      y={cy - size / 2 - 14}
                      textAnchor="middle"
                      fontSize={10}
                      fill={theme.palette.text.secondary}
                    >
                      {c.winRate}% · {c.total} rds
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </Box>
  );
}
