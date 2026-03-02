import {
  BarChart,
  Description as DescriptionIcon,
  EmojiEvents,
  SportsEsports,
} from "@mui/icons-material";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";

import AppBreadcrumbs from "../../app/shared/components/AppBreadcrumbs";
import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import { useLeagues } from "../../lib/hooks/useLeagues";
import MatchesList from "../matches/MatchesList";
import LeagueStats from "../stats/LeagueStats";
import Description from "./Description";
import Leaderboard from "./Leaderboard";

type Props = {
  tab: string;
};
export default function LeagueTabs({ tab }: Props) {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const { league, isLeagueLoading } = useLeagues(competitionId);
  const pathMap = ["description", "leaderboard", "matches", "stats"];

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(`/leagues/${competitionId}/${pathMap[newValue]}`);
  };

  if (isLeagueLoading) return <LoadingSkeleton variant="detail" />;
  if (!league)
    return (
      <EmptyState
        icon={<SportsEsports sx={{ fontSize: 48 }} />}
        message="League not found"
        action={{ label: "Back to leagues", href: "/leagues" }}
      />
    );

  return (
    <Box sx={{ width: "100%" }}>
      <AppBreadcrumbs items={[{ label: "Leagues", href: "/leagues" }, { label: league.title }]} />
      <Typography variant="h5" fontWeight="bold">
        {league.title}
      </Typography>
      <Box display="flex" flexDirection="column" flexGrow={1}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            variant="scrollable"
            value={pathMap.findIndex((path) => path === tab)}
            onChange={handleChange}
            aria-label="League tab switcher"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.95rem",
              },
              "& .Mui-selected": {
                color: "secondary.main",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "secondary.main",
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            <Tab
              icon={<DescriptionIcon fontSize="small" />}
              iconPosition="start"
              label="Description"
            />
            <Tab icon={<EmojiEvents fontSize="small" />} iconPosition="start" label="Leaderboard" />
            <Tab icon={<SportsEsports fontSize="small" />} iconPosition="start" label="Matches" />
            <Tab icon={<BarChart fontSize="small" />} iconPosition="start" label="Stats" />
          </Tabs>
        </Box>
        <Box
          sx={{
            "@keyframes tabFadeIn": {
              from: { opacity: 0, transform: "translateY(8px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
            animation: "tabFadeIn 0.25s ease-out",
            key: tab,
          }}
        >
          {tab === "description" && <Description />}
          {tab === "leaderboard" && <Leaderboard />}
          {tab === "matches" && <MatchesList />}
          {tab === "stats" && <LeagueStats />}
        </Box>
      </Box>
    </Box>
  );
}
