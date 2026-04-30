import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useMemo, useState } from "react";

import CharacterPortraitDot from "./CharacterPortraitDot";

const MIN_ROUNDS = 5;
const MIN_SIZE = 26;
const MAX_SIZE = 46;
const PAD_LEFT = 56;
const PAD_RIGHT = 16;
const PAD_TOP = 24;
const PAD_BOTTOM = 36;

type Props = { data: CharacterWinRate[] };

type Placed = {
  character: CharacterWinRate;
  size: number;
  cx: number;
  cy: number;
};

export default function MockupB_Beeswarm({ data }: Props) {
  const theme = useTheme();
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width <= 0 || height <= 0) return;
      setDims((prev) => (prev?.w === width && prev?.h === height ? prev : { w: width, h: height }));
    });
    observer.observe(node);
  }, []);

  const filtered = useMemo(() => data.filter((s) => s.total >= MIN_ROUNDS), [data]);

  const yDomain = useMemo(() => {
    if (filtered.length === 0) return [0, 10];
    const totals = filtered.map((s) => s.total);
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const pad = Math.max((max - min) * 0.1, 2);
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  }, [filtered]);

  const placed: Placed[] = useMemo(() => {
    if (!dims || filtered.length === 0) return [];
    const minWr = Math.min(...filtered.map((s) => s.winRate));
    const maxWr = Math.max(...filtered.map((s) => s.winRate));
    const wrRange = maxWr - minWr || 1;

    const plotW = dims.w - PAD_LEFT - PAD_RIGHT;
    const plotH = dims.h - PAD_TOP - PAD_BOTTOM;
    const cxCenter = PAD_LEFT + plotW / 2;
    const [yMin, yMax] = yDomain;
    const yToPx = (y: number) => PAD_TOP + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    const sorted = [...filtered].sort((a, b) => b.total - a.total);
    const out: Placed[] = [];
    for (const c of sorted) {
      const sizeNorm = (c.winRate - minWr) / wrRange;
      const size = MIN_SIZE + sizeNorm * (MAX_SIZE - MIN_SIZE);
      const r = size / 2 + 2;
      const cy = yToPx(c.total);

      let cx = cxCenter;
      let attempts = 0;
      const direction = sorted.indexOf(c) % 2 === 0 ? 1 : -1;
      while (attempts < 200) {
        const collides = out.some((p) => {
          const dx = p.cx - cx;
          const dy = p.cy - cy;
          const minDist = p.size / 2 + size / 2 + 4;
          return dx * dx + dy * dy < minDist * minDist;
        });
        if (!collides) break;
        const offset = (Math.floor(attempts / 2) + 1) * (r * 0.6);
        cx = cxCenter + (attempts % 2 === 0 ? direction : -direction) * offset;
        attempts += 1;
      }
      cx = Math.max(PAD_LEFT + r, Math.min(PAD_LEFT + plotW - r, cx));
      out.push({ character: c, size, cx, cy });
    }
    return out;
  }, [filtered, dims, yDomain]);

  const yTicks = useMemo(() => {
    const [yMin, yMax] = yDomain;
    const span = yMax - yMin;
    const step = Math.max(1, Math.round(span / 5));
    const ticks: number[] = [];
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) ticks.push(v);
    return ticks;
  }, [yDomain]);

  return (
    <Box ref={containerRef} sx={{ width: "100%", height: 500 }}>
      {filtered.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No characters with {MIN_ROUNDS}+ rounds played.
        </Typography>
      )}
      {dims && filtered.length > 0 && (
        <svg width={dims.w} height={dims.h}>
          {yTicks.map((t) => {
            const [yMin, yMax] = yDomain;
            const plotH = dims.h - PAD_TOP - PAD_BOTTOM;
            const y = PAD_TOP + plotH - ((t - yMin) / (yMax - yMin)) * plotH;
            return (
              <g key={t}>
                <line
                  x1={PAD_LEFT}
                  x2={dims.w - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke={theme.palette.divider}
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill={theme.palette.text.secondary}
                >
                  {t}
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
            Rounds Played
          </text>
          <text
            x={dims.w / 2}
            y={dims.h - 8}
            textAnchor="middle"
            fontSize={11}
            fill={theme.palette.text.secondary}
          >
            (bubble size = win rate)
          </text>
          {placed.map((p) => (
            <g key={p.character.characterId}>
              <CharacterPortraitDot
                cx={p.cx}
                cy={p.cy}
                size={p.size}
                imageUrl={p.character.imageUrl}
                name={p.character.name}
                uid="bs"
              />
              <title>
                {p.character.name} — {p.character.winRate}% over {p.character.total} rounds
              </title>
            </g>
          ))}
        </svg>
      )}
    </Box>
  );
}
