import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

  const scatterData = [...data]
    .sort((a, b) => b.total - a.total)
    .map((s) => ({
      x: s.total,
      winRate: s.winRate,
      total: s.total,
      name: s.name,
      imageUrl: s.imageUrl,
    }));

  const CharacterDot = (props: {
    cx?: number;
    cy?: number;
    payload?: (typeof scatterData)[number];
  }) => {
    const { cx = 0, cy = 0, payload } = props;
    if (!payload?.imageUrl) return null;
    const size = 36;
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
      {ready && (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, Math.max(...scatterData.map((d) => d.total)) + 1]}
              textAnchor="middle"
              height={60}
              tick={{ fontSize: 11 }}
              label={{ value: "Rounds Played", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="winRate"
              domain={[0, 100]}
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
