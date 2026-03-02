import { AccessTime, Add, Edit, Group, SportsEsports, Visibility } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router";

import { useAppTheme } from "../../app/context/ThemeContext";
import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import UserChip from "../../app/shared/components/UserChip";
import { useAccount } from "../../lib/hooks/useAccount";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { formatDate } from "../../lib/util/util";
import CompetitionCard from "../competitions/CompetitionCard";

export default function LeagueList() {
  const navigate = useNavigate();
  const { leagues, isLeaguesLoading } = useLeagues();
  const { currentUser } = useAccount();
  const { meta } = useAppTheme();
  if (isLeaguesLoading) return <LoadingSkeleton variant="list" count={3} />;
  if (!leagues || leagues.length === 0)
    return (
      <EmptyState
        icon={<SportsEsports sx={{ fontSize: 48 }} />}
        message="No leagues yet — create one to get started!"
        action={{ label: "Create League", href: "/createLeague" }}
      />
    );

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h2">Leagues</Typography>
        {currentUser && (
          <Button
            variant="contained"
            component={RouterLink}
            to="/createLeague"
            startIcon={<Add />}
            sx={{
              background: meta.accentGradient,
              color: "white",
              "&:hover": { opacity: 0.85 },
            }}
          >
            Create League
          </Button>
        )}
      </Box>
      {leagues.map((league) => (
        <CompetitionCard
          key={league.id}
          competition={league}
          actions={
            <>
              {currentUser &&
                league.members
                  .filter((m) => m.isAdmin)
                  .map((x) => x.userId)
                  .includes(currentUser.id) &&
                league.status == 0 && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate(`/manage/${league.id}/leaderboard`)}
                  >
                    <Edit />
                    <Typography variant="button" ml={1}>
                      Edit league
                    </Typography>
                  </Button>
                )}
              <Button
                variant="contained"
                onClick={() => navigate(`/leagues/${league.id}/leaderboard`)}
              >
                <Visibility />
                <Typography variant="button" ml={1}>
                  View
                </Typography>
              </Button>
            </>
          }
        >
          <Box>
            <Typography fontWeight="bold">Description:</Typography>
            <Typography mb={2}>{league.description}</Typography>
            <Box display="flex" alignItems="center">
              <SportsEsports sx={{ mr: 2, color: "error.main" }} />
              <Typography>Super Smash Bros</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <AccessTime sx={{ mr: 2, color: "info.main" }} />
              <Typography>{formatDate(league.startDate)}</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Group sx={{ mr: 2, color: "success.main" }} />
              <Typography>{league.members.length} players</Typography>
            </Box>
            <Box
              gap={1}
              mt={1}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              {league.members.map((member) => (
                <UserChip
                  key={member.userId}
                  userId={member.userId}
                  displayName={member.displayName}
                />
              ))}
            </Box>
          </Box>
        </CompetitionCard>
      ))}
    </>
  );
}
