import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MIN_ROUNDS = 5;
const MIN_SIZE = 22;
const MAX_SIZE = 42;

function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return ((hash & 0x7fffffff) % 1000) / 1000;
}

type Props = {
  data: CharacterWinRate[];
};

export default function CharacterWinRateScatter({ data }: Props) {
  const theme = useTheme();
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width <= 0 || height <= 0) return;
      setDims((prev) =>
        prev?.w === width && prev?.h === height ? prev : { w: width, h: height },
      );
    });
    observer.observe(node);
  }, []);

  const scatterData = useMemo(() => {
    const filtered = data.filter((s) => s.total >= MIN_ROUNDS);
    const minWr = Math.min(...filtered.map((s) => s.winRate));
    const maxWr = Math.max(...filtered.map((s) => s.winRate));
    const wrRange = maxWr - minWr || 1;

    return [...filtered]
      .sort((a, b) => b.total - a.total)
      .map((s) => {
        const jitterX = (seededRandom(s.name + "x") - 0.5) * 0.6;
        const sizeNorm = (s.winRate - minWr) / wrRange;
        const size = MIN_SIZE + sizeNorm * (MAX_SIZE - MIN_SIZE);
        return {
          x: jitterX,
          y: s.total,
          total: s.total,
          winRate: s.winRate,
          name: s.name,
          imageUrl: s.imageUrl,
          size: Math.round(size),
        };
      });
  }, [data]);

  const yDomain = useMemo(() => {
    if (scatterData.length === 0) return [0, 10];
    const rounds = scatterData.map((d) => d.total);
    const min = Math.min(...rounds);
    const max = Math.max(...rounds);
    const padding = Math.max((max - min) * 0.1, 2);
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [scatterData]);

  const CharacterDot = (props: {
    cx?: number;
    cy?: number;
    payload?: (typeof scatterData)[number];
  }) => {
    const { cx = 0, cy = 0, payload } = props;
    if (!payload?.imageUrl) return null;
    const size = payload.size;
    return (
      <g>
        <defs>
          <clipPath id={`clip-${payload.name}`}>
            <circle cx={cx} cy={cy} r={size / 2} />
          </clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={size / 2 + 2} fill={theme.palette.divider} />
        <image
          href={payload.imageUrl}
          x={cx - size / 2}
          y={cy - size / 2}
          width={size}
          height={size}
          clipPath={`url(#clip-${payload.name})`}
        />
      </g>
    );
  };

  return (
    <Box ref={containerRef} sx={{ width: "100%", height: 400 }}>
      {scatterData.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No characters with {MIN_ROUNDS}+ rounds played.
        </Typography>
      )}
      {dims && scatterData.length > 0 && (
        <ResponsiveContainer width={dims.w} height={dims.h}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.3}
              horizontal={true}
              vertical={false}
            />
            <XAxis
              type="number"
              dataKey="x"
              domain={[-1, 1]}
              hide={true}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={yDomain}
              label={{
                value: "Rounds Played",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const d = payload[0]?.payload as (typeof scatterData)[number];
                return (
                  <Box
                    sx={{
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 1.5,
                      boxShadow: 2,
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {d.name}
                    </Typography>
                    <Typography variant="caption">Win Rate: {d.winRate}%</Typography>
                    <br />
                    <Typography variant="caption">Rounds: {d.total}</Typography>
                  </Box>
                );
              }}
            />
            <Scatter data={scatterData} shape={<CharacterDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
