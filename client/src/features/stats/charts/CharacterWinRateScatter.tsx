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
const JITTER_AMOUNT = 1.5;

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
  const [ready, setReady] = useState(false);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setReady(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
  }, []);

  const scatterData = useMemo(() => {
    const filtered = data.filter((s) => s.total >= MIN_ROUNDS);
    return [...filtered]
      .sort((a, b) => b.total - a.total)
      .map((s) => {
        const jitterX = (seededRandom(s.name + "x") - 0.5) * JITTER_AMOUNT;
        const jitterY = (seededRandom(s.name + "y") - 0.5) * JITTER_AMOUNT;
        return {
          x: Math.log2(s.total) + jitterX * 0.1,
          winRate: s.winRate + jitterY,
          total: s.total,
          name: s.name,
          imageUrl: s.imageUrl,
          actualWinRate: s.winRate,
        };
      });
  }, [data]);

  const yDomain = useMemo(() => {
    if (scatterData.length === 0) return [0, 100];
    const rates = scatterData.map((d) => d.actualWinRate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const padding = Math.max((max - min) * 0.15, 5);
    return [
      Math.max(0, Math.floor((min - padding) / 5) * 5),
      Math.min(100, Math.ceil((max + padding) / 5) * 5),
    ];
  }, [scatterData]);

  const xMax = useMemo(() => {
    if (scatterData.length === 0) return 1;
    return Math.max(...data.filter((s) => s.total >= MIN_ROUNDS).map((d) => d.total));
  }, [data, scatterData.length]);

  const CharacterDot = (props: {
    cx?: number;
    cy?: number;
    payload?: (typeof scatterData)[number];
  }) => {
    const { cx = 0, cy = 0, payload } = props;
    if (!payload?.imageUrl) return null;
    const size = 28;
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

  const logTicks = useMemo(() => {
    const ticks: number[] = [];
    let v = MIN_ROUNDS;
    while (v <= xMax) {
      ticks.push(Math.log2(v));
      if (v < 10) v += 1;
      else if (v < 50) v += 5;
      else v += 10;
    }
    return ticks;
  }, [xMax]);

  return (
    <Box ref={containerRef} sx={{ width: "100%", height: 400 }}>
      {scatterData.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No characters with {MIN_ROUNDS}+ rounds played.
        </Typography>
      )}
      {ready && scatterData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="x"
              domain={[Math.log2(MIN_ROUNDS) - 0.3, Math.log2(xMax) + 0.3]}
              ticks={logTicks}
              tickFormatter={(v) => `${Math.round(Math.pow(2, v))}`}
              textAnchor="middle"
              height={60}
              tick={{ fontSize: 11 }}
              label={{ value: "Rounds Played", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="winRate"
              domain={yDomain}
              tickFormatter={(v) => `${v}%`}
              label={{
                value: "Win Rate",
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
                    <Typography variant="caption">Win Rate: {d.actualWinRate}%</Typography>
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
