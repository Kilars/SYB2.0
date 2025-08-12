import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import LeagueDetails from "./LeagueDetails";
import MatchesList from "../matches/MatchesList";
import LeagueStats from "../stats/LeagueStats";
import { useParams } from "react-router";
import { useLeagues } from "../../lib/hooks/useLeagues";
import Description from "./Description";

export default function LeagueTabs() {
  const { id } = useParams();
  const { league, isLeagueLoading } = useLeagues(id);
  const [index, setIndex] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setIndex(newValue);
  };

  if (isLeagueLoading) return <Typography>Loading...</Typography>
  if (!league) return <Typography>Could not find league</Typography>

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5">{league.title}</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={index} onChange={handleChange} aria-label="League tab switcher">
          <Tab label="Description" />
          <Tab label="Leaderboard" />
          <Tab label="Matches" />
          <Tab label="Stats" />
        </Tabs>
      </Box>
      {index === 0 && <Description />}
      {index === 1 && <LeagueDetails />}
      {index === 2 && <MatchesList />}
      {index === 3 && <LeagueStats />}
    </Box>
  );
}
