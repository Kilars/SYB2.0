import { Box, Tab, Tabs, Typography } from "@mui/material";
import Leaderboard from "./Leaderboard";
import MatchesList from "../matches/MatchesList";
import LeagueStats from "../stats/LeagueStats";
import { useNavigate, useParams } from "react-router";
import { useLeagues } from "../../lib/hooks/useLeagues";
import Description from "./Description";
import { BarChart, Description as DescriptionIcon, EmojiEvents, SportsEsports } from "@mui/icons-material";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import AppBreadcrumbs from "../../app/shared/components/AppBreadcrumbs";

type Props = {
  tab: string
}
export default function LeagueTabs({ tab }: Props) {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { league, isLeagueLoading } = useLeagues(leagueId);
  const pathMap = [
    'description',
    'leaderboard',
    'matches',
    'stats'
  ]

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(`/leagues/${leagueId}/${pathMap[newValue]}`)
  };

  if (isLeagueLoading) return <LoadingSkeleton variant="detail" />
  if (!league) return (
    <EmptyState
      icon={<SportsEsports sx={{ fontSize: 48 }} />}
      message="League not found"
      action={{ label: "Back to leagues", href: "/leagues" }}
    />
  )

  return (
    <Box sx={{ width: '100%' }}>
      <AppBreadcrumbs items={[{ label: 'Leagues', href: '/leagues' }, { label: league.title }]} />
      <Typography variant="h5" fontWeight="bold">{league.title}</Typography>
      <Box display='flex' flexDirection='column' flexGrow={1}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3}}>
          <Tabs
            variant="scrollable"
            value={pathMap.findIndex(path => path === tab)}
            onChange={handleChange}
            aria-label="League tab switcher"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
              },
              '& .Mui-selected': {
                color: 'secondary.main',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'secondary.main',
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            <Tab icon={<DescriptionIcon fontSize="small" />} iconPosition="start" label="Description" />
            <Tab icon={<EmojiEvents fontSize="small" />} iconPosition="start" label="Leaderboard" />
            <Tab icon={<SportsEsports fontSize="small" />} iconPosition="start" label="Matches" />
            <Tab icon={<BarChart fontSize="small" />} iconPosition="start" label="Stats" />
          </Tabs>
        </Box>
        <Box>
          {tab === 'description' && <Description />}
          {tab === 'leaderboard' && <Leaderboard />}
          {tab === 'matches' && <MatchesList />}
          {tab === 'stats' && <LeagueStats />}
        </Box>
      </Box>
    </Box>
  );
}
