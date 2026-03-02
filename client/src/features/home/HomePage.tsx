import {
  CheckCircle,
  EmojiEvents,
  SportsEsports,
  SportsKabaddi,
  TrendingUp,
} from "@mui/icons-material";
import { Box, Button, Card, CardContent, Chip, Paper, Skeleton, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router";

import { useAppTheme } from "../../app/context/ThemeContext";
import { SMASH_COLORS } from "../../app/theme";
import { useAccount } from "../../lib/hooks/useAccount";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useTournaments } from "../../lib/hooks/useTournaments";
import { useUserMatches } from "../../lib/hooks/useUserMatches";

function HeroSection() {
  const { meta } = useAppTheme();
  return (
    <Paper
      sx={{
        color: "white",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 96px)",
        py: { xs: 8, sm: 12 },
        px: 3,
        backgroundImage: meta.heroGradient,
        borderRadius: 2,
        mb: 4,
      }}
    >
      <SportsEsports sx={{ fontSize: { xs: 60, sm: 80 }, color: "white" }} />
      <Typography
        variant="h3"
        sx={{ fontSize: { xs: "1.75rem", sm: "3rem" }, textAlign: "center" }}
      >
        Smash Your Bros
      </Typography>
      <Typography
        variant="h5"
        textAlign="center"
        sx={{ opacity: 0.9, fontSize: { xs: "1rem", sm: "1.5rem" } }}
      >
        Track your league — matches, stats, and bragging rights
      </Typography>
      <Button
        component={Link}
        to="/leagues"
        size="large"
        variant="contained"
        startIcon={<EmojiEvents />}
        sx={{
          height: { xs: 56, sm: 72 },
          borderRadius: 4,
          fontSize: "1.0rem",
          background: meta.accentGradient,
          color: "white",
          fontWeight: "bold",
          px: 4,
          "&:hover": { opacity: 0.85 },
        }}
      >
        View Leagues
      </Button>
    </Paper>
  );
}

function QuickStats({ userId }: { userId: string }) {
  const { userMatches, isUserMatchesLoading } = useUserMatches(userId);

  if (isUserMatchesLoading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  if (!userMatches || userMatches.length === 0) return null;

  const completedMatches = userMatches.filter((m) => m.completed);
  const wins = completedMatches.filter((m) => m.winnerUserId === userId).length;
  const losses = completedMatches.length - wins;
  const winRate =
    completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0;
  const pendingMatches = userMatches.filter((m) => !m.completed).length;

  const stats = [
    { label: "Wins", value: wins, color: SMASH_COLORS.p4Green, icon: <CheckCircle /> },
    { label: "Losses", value: losses, color: SMASH_COLORS.p1Red, icon: <SportsKabaddi /> },
    { label: "Win Rate", value: `${winRate}%`, color: SMASH_COLORS.p2Blue, icon: <TrendingUp /> },
    {
      label: "Pending",
      value: pendingMatches,
      color: SMASH_COLORS.p3Yellow,
      icon: <SportsEsports />,
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Your Stats
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        {stats.map((stat) => (
          <Card
            key={stat.label}
            sx={{
              borderTop: `3px solid ${stat.color}`,
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <CardContent sx={{ textAlign: "center", py: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ color: stat.color, mb: 0.5 }}>{stat.icon}</Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ color: stat.color, fontSize: { xs: "1.5rem", sm: "2rem" } }}
              >
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

function RecentMatches({ userId }: { userId: string }) {
  const { userMatches, isUserMatchesLoading } = useUserMatches(userId);
  const navigate = useNavigate();

  if (isUserMatchesLoading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Recent Matches
        </Typography>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
        ))}
      </Box>
    );
  }

  if (!userMatches || userMatches.length === 0) return null;

  const recentMatches = [...userMatches].sort((a, b) => b.matchNumber - a.matchNumber).slice(0, 5);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Recent Matches
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        {recentMatches.map((match) => {
          const isPlayerOne = match.playerOne?.userId === userId;
          const opponent = isPlayerOne ? match.playerTwo : match.playerOne;
          const won = match.completed && match.winnerUserId === userId;
          const p1Wins = match.rounds.filter(
            (r) => r.winnerUserId === match.playerOne?.userId,
          ).length;
          const p2Wins = match.rounds.filter(
            (r) => r.winnerUserId === match.playerTwo?.userId,
          ).length;

          return (
            <Card
              key={match.competitionId + match.bracketNumber + match.matchNumber}
              sx={{
                cursor: "pointer",
                borderLeft: `4px solid ${!match.completed ? SMASH_COLORS.p2Blue : won ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red}`,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                "&:hover": {
                  transform: "translateX(4px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                },
              }}
              onClick={() =>
                navigate(
                  `/leagues/${match.competitionId}/bracket/${match.bracketNumber}/match/${match.matchNumber}`,
                )
              }
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight="bold" noWrap>
                      vs {opponent?.displayName}
                      {opponent?.isGuest ? " (guest)" : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Match #{match.matchNumber} · Split {match.bracketNumber}
                    </Typography>
                  </Box>
                  {match.completed ? (
                    <Chip
                      label={`${isPlayerOne ? p1Wins : p2Wins}–${isPlayerOne ? p2Wins : p1Wins}`}
                      size="small"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: won
                          ? `${SMASH_COLORS.p4Green}22`
                          : `${SMASH_COLORS.p1Red}22`,
                        color: won ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red,
                        border: `1px solid ${won ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red}`,
                      }}
                    />
                  ) : (
                    <Chip label="Pending" size="small" color="info" variant="outlined" />
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

function ActiveLeagues() {
  const { leagues, isLeaguesLoading } = useLeagues();
  const navigate = useNavigate();

  if (isLeaguesLoading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Active Leagues
        </Typography>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={50} sx={{ borderRadius: 1, mb: 1 }} />
        ))}
      </Box>
    );
  }

  const activeLeagues = leagues?.filter((l) => l.status === 1) ?? [];
  if (activeLeagues.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Active Leagues
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        {activeLeagues.map((league) => {
          const completedMatches = league.matches.filter((m) => m.completed).length;
          const totalMatches = league.matches.length;

          return (
            <Card
              key={league.id}
              sx={{
                cursor: "pointer",
                borderLeft: `4px solid ${SMASH_COLORS.p2Blue}`,
                transition: "transform 0.15s ease",
                "&:hover": { transform: "translateX(4px)" },
              }}
              onClick={() => navigate(`/leagues/${league.id}`)}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight="bold" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {league.title}
                  </Typography>
                  <Chip
                    label={`${completedMatches}/${totalMatches}`}
                    size="small"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: `${SMASH_COLORS.p2Blue}15`,
                      color: SMASH_COLORS.p2Blue,
                      border: `1px solid ${SMASH_COLORS.p2Blue}`,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

function ActiveTournaments() {
  const { tournaments, isTournamentsLoading } = useTournaments();
  const navigate = useNavigate();

  if (isTournamentsLoading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Active Tournaments
        </Typography>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={50} sx={{ borderRadius: 1, mb: 1 }} />
        ))}
      </Box>
    );
  }

  const activeTournaments = tournaments?.filter((t) => t.status === 1) ?? [];
  if (activeTournaments.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Active Tournaments
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        {activeTournaments.map((tournament) => {
          const completedMatches = tournament.matches.filter((m) => m.completed).length;
          const totalMatches = tournament.matches.length;

          return (
            <Card
              key={tournament.id}
              sx={{
                cursor: "pointer",
                borderLeft: `4px solid ${SMASH_COLORS.p3Yellow}`,
                transition: "transform 0.15s ease",
                "&:hover": { transform: "translateX(4px)" },
              }}
              onClick={() => navigate(`/tournaments/${tournament.id}`)}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight="bold" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {tournament.title}
                  </Typography>
                  <Chip
                    label={`${completedMatches}/${totalMatches}`}
                    size="small"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: `${SMASH_COLORS.p3Yellow}15`,
                      color: SMASH_COLORS.p3Yellow,
                      border: `1px solid ${SMASH_COLORS.p3Yellow}`,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

export default function HomePage() {
  const { currentUser, loadingUserInfo } = useAccount();

  if (loadingUserInfo) {
    return (
      <Box>
        <HeroSection />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!currentUser) {
    return <HeroSection />;
  }

  return (
    <Box>
      <HeroSection />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <Box>
          <QuickStats userId={currentUser.id} />
          <ActiveLeagues />
          <ActiveTournaments />
        </Box>
        <Box>
          <RecentMatches userId={currentUser.id} />
        </Box>
      </Box>
    </Box>
  );
}
