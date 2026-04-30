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
const DOT_SIZE = 32;

type Props = { data: CharacterWinRate[] };

export default function CharacterWinRateLogScatter({ data }: Props) {
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
    return data.filter((s) => s.total >= MIN_ROUNDS).map((s) => ({ ...s, x: s.total, y: s.winRate }));
  }, [data]);

  const xDomain = useMemo(() => {
    if (scatterData.length === 0) return [1, 10];
    const totals = scatterData.map((d) => d.total);
    const min = Math.max(1, Math.min(...totals));
    const max = Math.max(...totals);
    return [Math.max(1, Math.floor(min * 0.8)), Math.ceil(max * 1.1)];
  }, [scatterData]);

  return (
    <Box ref={containerRef} sx={{ width: "100%", height: 500 }}>
      {scatterData.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No characters with {MIN_ROUNDS}+ rounds played.
        </Typography>
      ) : (
        dims && (
          <ResponsiveContainer width={dims.w} height={dims.h}>
            <ScatterChart margin={{ top: 20, right: 24, bottom: 50, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                dataKey="x"
                scale="log"
                domain={xDomain}
                allowDataOverflow
                tickFormatter={(v) => String(Math.round(v))}
                label={{
                  value: "Rounds Played (log)",
                  position: "insideBottom",
                  offset: -10,
                  style: { fontSize: 12 },
                }}
              />
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
                      size={DOT_SIZE}
                      imageUrl={p.payload.imageUrl}
                      name={p.payload.name}
                      uid="ls"
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
