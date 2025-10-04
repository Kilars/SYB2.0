import { Box, Tab, Tabs, Typography } from "@mui/material";
import Leaderboard from "./Leaderboard";
import MatchesList from "../matches/MatchesList";
import LeagueStats from "../stats/LeagueStats";
import { useNavigate, useParams } from "react-router";
import { useLeagues } from "../../lib/hooks/useLeagues";
import Description from "./Description";

type Props = {
  tab: string
}
export default function LeagueTabs({ tab }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { league, isLeagueLoading } = useLeagues(id);
  const pathMap = [
    'description',
    'leaderboard',
    'matches',
    'stats'
  ]

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(`/leagues/${id}/${pathMap[newValue]}`)
  };

  if (isLeagueLoading) return <Typography>Loading...</Typography>
  if (!league) return <Typography>Could not find league</Typography>

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5">{league.title}</Typography>
      <Box display='flex' flexDirection='column' flexGrow={1}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3}}>
          <Tabs variant="scrollable" value={pathMap.findIndex(path => path === tab)} onChange={handleChange} aria-label="League tab switcher">
            <Tab label="Description" />
            <Tab label="Leaderboard" />
            <Tab label="Matches" />
            <Tab label="Stats" />
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
