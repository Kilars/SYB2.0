import { BarChart as BarChartIcon } from "@mui/icons-material";
import { Box, Divider, Paper, Typography } from "@mui/material";
import type { ComponentType } from "react";
import { useParams } from "react-router";

import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { computeCharacterWinRates } from "../../lib/util/statUtils";
import {
  MockupA_VerticalBubble,
  MockupB_Beeswarm,
  MockupC_TwoAxis,
  MockupD_Lollipop,
} from "./charts/mockups";

const variants: {
  label: string;
  blurb: string;
  Component: ComponentType<{ data: CharacterWinRate[] }>;
}[] = [
  {
    label: "A. Vertical Bubble (Win Rate on Y)",
    blurb:
      "Y = Win Rate % (full 0–100 stretches over the tall mobile canvas), X = jitter, bubble size = rounds played. Reference line at 50%.",
    Component: MockupA_VerticalBubble,
  },
  {
    label: "B. Beeswarm (Y = Rounds Played)",
    blurb:
      "Same axes as today, but X positions are collision-resolved instead of random — bubbles always pack tightly without overlap. Bubble size = win rate.",
    Component: MockupB_Beeswarm,
  },
  {
    label: "C. Two-axis log scatter",
    blurb:
      "X = Rounds Played (log scale spreads the low-volume cluster), Y = Win Rate %. Both axes meaningful, fixed-size portraits.",
    Component: MockupC_TwoAxis,
  },
  {
    label: "D. Lollipop, sorted by volume",
    blurb:
      "Characters laid out on a fixed grid (most played → least played), Y = Win Rate %, stem from 50% baseline. Zero overlap by construction. Bubble size = rounds played.",
    Component: MockupD_Lollipop,
  },
];

export default function CharacterWinRateMockups() {
  const { competitionId } = useParams();
  const { league, isLeagueLoading } = useLeagues(competitionId);
  const { characters } = useCharacters();

  if (isLeagueLoading) return <LoadingSkeleton variant="chart" count={4} />;
  if (!league || !characters)
    return (
      <EmptyState icon={<BarChartIcon sx={{ fontSize: 48 }} />} message="No league stats yet" />
    );

  const charStats = computeCharacterWinRates(league.matches, characters);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Comparison of {variants.length} character-winrate plot variants on the same dataset (
        {charStats.filter((c) => c.total >= 5).length} characters with 5+ rounds).
      </Typography>
      {variants.map((v, i) => (
        <Paper key={v.label} variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "primary.main" }}>
            {v.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {v.blurb}
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <v.Component data={charStats} />
          {i < variants.length - 1 && <Box sx={{ height: 8 }} />}
        </Paper>
      ))}
    </Box>
  );
}
