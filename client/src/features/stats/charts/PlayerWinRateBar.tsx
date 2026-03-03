import { Box } from "@mui/material";
import { useCallback, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SMASH_COLORS } from "../../../app/theme";

const CHART_COLORS = [
  SMASH_COLORS.p1Red,
  SMASH_COLORS.p2Blue,
  SMASH_COLORS.p3Yellow,
  SMASH_COLORS.p4Green,
  "#AB47BC",
  "#FF7043",
  "#26C6DA",
  "#8D6E63",
  "#EC407A",
  "#66BB6A",
  "#FFA726",
  "#5C6BC0",
  "#78909C",
  "#D4E157",
  "#29B6F6",
  "#EF5350",
];

type Props = {
  data: PlayerWinRate[];
};

export default function PlayerWinRateBar({ data }: Props) {
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

  const chartData = data.map((p, i) => ({
    name: p.displayName,
    winRate: p.winRate,
    wins: p.wins,
    losses: p.losses,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const height = Math.max(200, chartData.length * 50);

  return (
    <Box ref={containerRef} sx={{ width: "100%", height }}>
      {ready && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${value}%`, "Win Rate"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #ddd" }}
            />
            <Legend />
            <Bar dataKey="winRate" name="Win Rate %" radius={[0, 6, 6, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
