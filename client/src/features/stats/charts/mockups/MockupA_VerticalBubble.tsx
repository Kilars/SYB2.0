import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import CharacterPortraitDot from "./CharacterPortraitDot";

const MIN_ROUNDS = 5;
const MIN_SIZE = 22;
const MAX_SIZE = 46;

function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return ((hash & 0x7fffffff) % 1000) / 1000;
}

type Props = { data: CharacterWinRate[] };

export default function MockupA_VerticalBubble({ data }: Props) {
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

  const scatterData = useMemo(() => {
    const filtered = data.filter((s) => s.total >= MIN_ROUNDS);
    const minTotal = Math.min(...filtered.map((s) => s.total));
    const maxTotal = Math.max(...filtered.map((s) => s.total));
    const range = maxTotal - minTotal || 1;
    return filtered.map((s) => {
      const norm = (s.total - minTotal) / range;
      const size = MIN_SIZE + norm * (MAX_SIZE - MIN_SIZE);
      return {
        x: (seededRandom(s.name + "vb") - 0.5) * 0.8,
        y: s.winRate,
        size: Math.round(size),
        ...s,
      };
    });
  }, [data]);

  return (
    <Box ref={containerRef} sx={{ width: "100%", height: 500 }}>
      {scatterData.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No characters with {MIN_ROUNDS}+ rounds played.
        </Typography>
      ) : (
        dims && (
          <ResponsiveContainer width={dims.w} height={dims.h}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
              <XAxis type="number" dataKey="x" domain={[-1, 1]} hide />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                label={{
                  value: "Win Rate",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <ReferenceLine
                y={50}
                stroke={theme.palette.warning.main}
                strokeDasharray="4 4"
                opacity={0.6}
              />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload as (typeof scatterData)[number];
                  return (
                    <Box
                      sx={{
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        p: 1.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {d.name}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Win Rate: {d.winRate}%
                      </Typography>
                      <Typography variant="caption">Rounds: {d.total}</Typography>
                    </Box>
                  );
                }}
              />
              <Scatter
                data={scatterData}
                shape={(props: unknown) => {
                  const p = props as {
                    cx: number;
                    cy: number;
                    payload: (typeof scatterData)[number];
                  };
                  return (
                    <CharacterPortraitDot
                      cx={p.cx}
                      cy={p.cy}
                      size={p.payload.size}
                      imageUrl={p.payload.imageUrl}
                      name={p.payload.name}
                      uid="vb"
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )
      )}
    </Box>
  );
}
