import { Delete, EmojiEvents, ExpandMore, PlayArrow, Shuffle } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";

import { useAppTheme } from "../../app/context/ThemeContext";
import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import PodiumDisplay from "../../app/shared/components/PodiumDisplay";
import { SMASH_COLORS } from "../../app/theme";
import { useAccount } from "../../lib/hooks/useAccount";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { useTournaments } from "../../lib/hooks/useTournaments";
import { totalRoundsFor } from "../../lib/util/bracketSizing";
import { COMPETITION_STATUSES } from "../../lib/util/constants";
import { computeCharacterWinRates, computePlayerWinRates } from "../../lib/util/statUtils";
import { CharacterWinRateLogScatter, CharacterWinRateTable, PlayerWinRateBar } from "../stats/charts";

function getRoundLabel(bracketRound: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - bracketRound;
  if (roundsFromEnd === 0) return "Final";
  if (roundsFromEnd === 1) return "Semifinals";
  if (roundsFromEnd === 2) return "Quarterfinals";
  return `Round ${bracketRound}`;
}

// ─── N=2 match card (existing two-player layout) ────────────────────────────

interface BracketMatchCardProps {
  match: Match;
  onClick: () => void;
}

function BracketMatchCardN2({ match, onClick }: BracketMatchCardProps) {
  const getPlayerName = (player?: Player) => {
    if (!player) return "— TBD —";
    return player.isGuest ? `${player.displayName} (guest)` : player.displayName;
  };

  const isP1Winner = match.completed && match.winnerUserId === match.playerOne?.userId;
  const isP2Winner = match.completed && match.winnerUserId === match.playerTwo?.userId;
  const canPlay = match.playerOne && match.playerTwo && !match.completed;

  const p1Wins = match.rounds.filter((r) => r.winnerUserId === match.playerOne?.userId).length;
  const p2Wins = match.rounds.filter((r) => r.winnerUserId === match.playerTwo?.userId).length;

  return (
    <Card
      onClick={match.playerOne && match.playerTwo ? onClick : undefined}
      sx={{
        minWidth: { xs: 180, sm: 220 },
        maxWidth: 260,
        cursor: match.playerOne && match.playerTwo ? "pointer" : "default",
        border: match.completed
          ? `2px solid ${SMASH_COLORS.p4Green}`
          : canPlay
            ? `2px solid ${SMASH_COLORS.p2Blue}`
            : "1px solid",
        borderColor: match.completed
          ? SMASH_COLORS.p4Green
          : canPlay
            ? SMASH_COLORS.p2Blue
            : "divider",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...(canPlay && {
          "@keyframes bracketPulse": {
            "0%, 100%": { boxShadow: `0 0 0 0 ${SMASH_COLORS.p2Blue}44` },
            "50%": { boxShadow: `0 0 0 4px ${SMASH_COLORS.p2Blue}22` },
          },
          animation: "bracketPulse 2s ease-in-out infinite",
        }),
        "&:hover":
          match.playerOne && match.playerTwo
            ? {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                animation: "none",
              }
            : {},
        opacity: !match.playerOne && !match.playerTwo ? 0.5 : 1,
      }}
    >
      <Box sx={{ p: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 0.75,
            px: 1,
            borderRadius: 1,
            backgroundColor: isP1Winner ? `${SMASH_COLORS.p4Green}15` : "transparent",
          }}
        >
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: isP1Winner ? "bold" : "normal",
              fontStyle: !match.playerOne ? "italic" : "normal",
              color: !match.playerOne
                ? "text.disabled"
                : isP1Winner
                  ? SMASH_COLORS.p4Green
                  : "text.primary",
              flex: 1,
              minWidth: 0,
            }}
          >
            {getPlayerName(match.playerOne)}
          </Typography>
          {match.completed && (
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ ml: 1, color: isP1Winner ? SMASH_COLORS.p4Green : "text.secondary" }}
            >
              {p1Wins}
            </Typography>
          )}
        </Box>

        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 0.75,
            px: 1,
            borderRadius: 1,
            backgroundColor: isP2Winner ? `${SMASH_COLORS.p4Green}15` : "transparent",
          }}
        >
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: isP2Winner ? "bold" : "normal",
              fontStyle: !match.playerTwo ? "italic" : "normal",
              color: !match.playerTwo
                ? "text.disabled"
                : isP2Winner
                  ? SMASH_COLORS.p4Green
                  : "text.primary",
              flex: 1,
              minWidth: 0,
            }}
          >
            {getPlayerName(match.playerTwo)}
          </Typography>
          {match.completed && (
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ ml: 1, color: isP2Winner ? SMASH_COLORS.p4Green : "text.secondary" }}
            >
              {p2Wins}
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
}

// ─── N>2 heat card ────────────────────────────────────────────────────────────

interface HeatCardNProps {
  match: Match;
  members: CompetitionMember[];
  onClick: () => void;
}

type HeatPlayer = { userId: string; displayName: string; isGuest?: boolean };

function HeatCardN({ match, members, onClick }: HeatCardNProps) {
  // Resolve player data from members list. GetTournamentDetails only includes PlayerOne/Two
  // as nav properties; PlayerThree/Four are resolved from userId fields + members list.
  const findMember = (userId?: string | null): HeatPlayer | undefined => {
    if (!userId) return undefined;
    const m = members.find((mb) => mb.userId === userId);
    return m ? { userId: m.userId, displayName: m.displayName, isGuest: m.isGuest } : undefined;
  };

  const p1: HeatPlayer | undefined = match.playerOne
    ? { userId: match.playerOne.userId, displayName: match.playerOne.displayName, isGuest: match.playerOne.isGuest }
    : undefined;
  const p2: HeatPlayer | undefined = match.playerTwo
    ? { userId: match.playerTwo.userId, displayName: match.playerTwo.displayName, isGuest: match.playerTwo.isGuest }
    : undefined;
  const p3 = findMember(match.playerThreeUserId);
  const p4 = findMember(match.playerFourUserId);

  const playerCount = match.playerCount ?? 2;
  const rawPlayers: (HeatPlayer | undefined)[] = [p1, p2, p3, p4].slice(0, playerCount);
  const players: HeatPlayer[] = rawPlayers.filter((p): p is HeatPlayer => p != null);
  const allAssigned = players.length === playerCount;
  const canPlay = allAssigned && !match.completed;

  const podiumPlacements = {
    winner: findMember(match.winnerUserId),
    second: findMember(match.secondPlaceUserId),
    third: findMember(match.thirdPlaceUserId),
    fourth: findMember(match.fourthPlaceUserId),
  };
  const podiumParticipants = players.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    isGuest: p.isGuest,
  }));

  return (
    <Card
      sx={{
        maxWidth: 300,
        border: match.completed
          ? `2px solid ${SMASH_COLORS.p4Green}`
          : canPlay
            ? `2px solid ${SMASH_COLORS.p2Blue}`
            : "1px solid",
        borderColor: match.completed
          ? SMASH_COLORS.p4Green
          : canPlay
            ? SMASH_COLORS.p2Blue
            : "divider",
        opacity: !allAssigned && !match.completed ? 0.5 : 1,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...(canPlay && {
          "@keyframes bracketPulse": {
            "0%, 100%": { boxShadow: `0 0 0 0 ${SMASH_COLORS.p2Blue}44` },
            "50%": { boxShadow: `0 0 0 4px ${SMASH_COLORS.p2Blue}22` },
          },
          animation: "bracketPulse 2s ease-in-out infinite",
        }),
        ...(canPlay && {
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "none",
          },
        }),
      }}
      onClick={canPlay ? onClick : undefined}
    >
      <Box sx={{ p: 1.5 }}>
        {match.completed && podiumPlacements.winner ? (
          <PodiumDisplay
            placements={podiumPlacements}
            participants={podiumParticipants}
            collapseRule="never"
          />
        ) : (
          <>
            {players.length === 0 ? (
              <Typography variant="body2" color="text.disabled" fontStyle="italic" sx={{ px: 1 }}>
                — TBD —
              </Typography>
            ) : (
              players.map((p) => (
                <Typography key={p.userId} variant="body2" noWrap sx={{ px: 1, py: 0.25 }}>
                  {p.isGuest ? `${p.displayName} (guest)` : p.displayName}
                </Typography>
              ))
            )}
            {canPlay && (
              <Box sx={{ mt: 1, textAlign: "center" }}>
                <Typography variant="caption" color="primary.main" fontWeight="bold">
                  Tap to enter result
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Card>
  );
}

// ─── Main BracketView ─────────────────────────────────────────────────────────

export default function BracketView() {
  const { competitionId } = useParams();
  const { tournament, isTournamentLoading, startTournament, shuffleBracket, deleteTournament } =
    useTournaments(competitionId);
  const { currentUser } = useAccount();
  const { characters } = useCharacters();
  const { meta } = useAppTheme();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [isStarting, setIsStarting] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);

  if (isTournamentLoading) return <LoadingSkeleton variant="detail" />;
  if (!tournament)
    return (
      <EmptyState icon={<EmojiEvents sx={{ fontSize: 48 }} />} message="Tournament not found" />
    );

  const isAdmin =
    currentUser && tournament.members.some((m) => m.userId === currentUser.id && m.isAdmin);

  const perHeatN = tournament.perHeatPlayerCount ?? 2;
  const totalRounds = totalRoundsFor(perHeatN, tournament.bracketSize);

  // Group matches by bracket number (round), sorted by match number
  const matchesByRound: Record<number, Match[]> = {};
  for (const match of tournament.matches) {
    if (!matchesByRound[match.bracketNumber]) matchesByRound[match.bracketNumber] = [];
    matchesByRound[match.bracketNumber].push(match);
  }
  for (const round in matchesByRound) {
    matchesByRound[round].sort((a, b) => a.matchNumber - b.matchNumber);
  }

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await startTournament.mutateAsync();
    } finally {
      setIsStarting(false);
    }
  };

  const handleShuffle = async () => {
    setIsShuffling(true);
    try {
      await shuffleBracket.mutateAsync();
    } catch {
      toast("Failed to shuffle bracket", { type: "error" });
    } finally {
      setIsShuffling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTournament.mutateAsync();
      toast("Tournament deleted successfully", { type: "success" });
      navigate("/tournaments");
    } catch {
      toast("Failed to delete tournament", { type: "error" });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const canShuffle = tournament.status === 1 && !tournament.matches.some((m) => m.completed);

  const winner = tournament.winnerUserId
    ? tournament.members.find((m) => m.userId === tournament.winnerUserId)
    : null;

  const roundNumbers = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            {tournament.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {tournament.description}
          </Typography>
          <Box display="flex" gap={1} mt={1} flexWrap="wrap">
            <Chip
              label={COMPETITION_STATUSES[tournament.status][0]}
              color={
                tournament.status === 0 ? "warning" : tournament.status === 1 ? "success" : "info"
              }
              sx={{ fontWeight: "bold" }}
            />
            {perHeatN === 2 ? (
              <Chip label={`Best of ${tournament.bestOf}`} variant="outlined" />
            ) : (
              <Chip label={`${perHeatN}-player FFA`} variant="outlined" />
            )}
            <Chip label={`${tournament.members.length} players`} variant="outlined" />
          </Box>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          {isAdmin && tournament.status === 0 && (
            <Button
              variant="contained"
              startIcon={isStarting ? <CircularProgress size={20} /> : <PlayArrow />}
              disabled={isStarting}
              onClick={handleStart}
              sx={{
                background: meta.accentGradient,
                color: "white",
                "&:hover": { opacity: 0.85 },
              }}
            >
              {isStarting ? "Starting..." : "Start Tournament"}
            </Button>
          )}
          {isAdmin && canShuffle && (
            <Button
              variant="outlined"
              startIcon={isShuffling ? <CircularProgress size={20} /> : <Shuffle />}
              disabled={isShuffling}
              onClick={handleShuffle}
            >
              {isShuffling ? "Shuffling..." : "Shuffle Bracket"}
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      {/* Winner banner */}
      {winner && (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            textAlign: "center",
            background: meta.heroGradient,
            color: "white",
            borderRadius: 2,
          }}
        >
          <EmojiEvents sx={{ fontSize: 48, color: SMASH_COLORS.gold }} />
          <Typography variant="h5" fontWeight="bold" mt={1}>
            {winner.displayName} wins!
          </Typography>
        </Paper>
      )}

      {/* Planned state: show member list */}
      {tournament.status === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Players ({tournament.members.length})
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
              gap: 1,
            }}
          >
            {tournament.members.map((member) => (
              <Chip
                key={member.userId}
                label={`${member.displayName}${member.isGuest ? " (guest)" : ""}${member.isAdmin ? " ★" : ""}`}
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Active/Complete: bracket view */}
      {tournament.status > 0 && (
        isMobile ? (
          // Mobile: horizontal scroll-snap — each round is a full-width column
          <Box
            sx={{
              display: "flex",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              pb: 2,
              mx: -2, // bleed to screen edge
              px: 2,
            }}
          >
            {roundNumbers.map((bracketRound) => {
              const matches = matchesByRound[bracketRound] || [];
              const roundLabel = getRoundLabel(bracketRound, totalRounds);

              return (
                <Box
                  key={bracketRound}
                  sx={{
                    flex: "0 0 100vw",
                    scrollSnapAlign: "start",
                    pr: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    textAlign="center"
                    sx={{
                      mb: 2,
                      py: 0.5,
                      px: 2,
                      borderRadius: 1,
                      backgroundColor: "action.hover",
                    }}
                  >
                    {roundLabel}
                    {totalRounds > 1 && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({bracketRound}/{totalRounds})
                      </Typography>
                    )}
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {matches.map((match) =>
                      perHeatN === 2 ? (
                        <BracketMatchCardN2
                          key={match.matchNumber}
                          match={match}
                          onClick={() =>
                            navigate(
                              `/tournaments/${tournament.id}/bracket/${match.bracketNumber}/match/${match.matchNumber}`,
                            )
                          }
                        />
                      ) : (
                        <HeatCardN
                          key={match.matchNumber}
                          match={match}
                          members={tournament.members}
                          onClick={() =>
                            navigate(
                              `/tournaments/${tournament.id}/bracket/${match.bracketNumber}/match/${match.matchNumber}`,
                            )
                          }
                        />
                      ),
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          // Desktop: side-by-side columns (existing behavior)
          <Box
            sx={{
              overflowX: "auto",
              pb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: { xs: 2, sm: 4 },
                minWidth: "fit-content",
                alignItems: "stretch",
              }}
            >
              {roundNumbers.map((bracketRound) => {
                const matches = matchesByRound[bracketRound] || [];
                const roundLabel = getRoundLabel(bracketRound, totalRounds);

                return (
                  <Box
                    key={bracketRound}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                      minWidth: { xs: 200, sm: 240 },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      textAlign="center"
                      sx={{
                        mb: 2,
                        py: 0.5,
                        px: 2,
                        borderRadius: 1,
                        backgroundColor: "action.hover",
                      }}
                    >
                      {roundLabel}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-around",
                        flex: 1,
                        gap: 2,
                      }}
                    >
                      {matches.map((match) =>
                        perHeatN === 2 ? (
                          <BracketMatchCardN2
                            key={match.matchNumber}
                            match={match}
                            onClick={() =>
                              navigate(
                                `/tournaments/${tournament.id}/bracket/${match.bracketNumber}/match/${match.matchNumber}`,
                              )
                            }
                          />
                        ) : (
                          <HeatCardN
                            key={match.matchNumber}
                            match={match}
                            members={tournament.members}
                            onClick={() =>
                              navigate(
                                `/tournaments/${tournament.id}/bracket/${match.bracketNumber}/match/${match.matchNumber}`,
                              )
                            }
                          />
                        ),
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )
      )}

      {/* Stats section */}
      {tournament.status > 0 && tournament.matches.some((m) => m.completed) && characters && (
        <Accordion sx={{ mt: 3 }} onChange={(_, expanded) => setStatsExpanded(expanded)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" fontWeight="bold">
              Stats
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {statsExpanded &&
              (() => {
                const completedMatches = tournament.matches.filter((m) => m.completed);
                const charStats = computeCharacterWinRates(completedMatches, characters);
                const players = tournament.members.map((m) => ({
                  userId: m.userId,
                  displayName: m.displayName,
                }));
                const playerStats = computePlayerWinRates(completedMatches, players);
                return (
                  <>
                    {charStats.length > 0 && (
                      <Box mb={3}>
                        <Typography variant="subtitle1" fontWeight="bold" mb={1} sx={{ color: "primary.main" }}>
                          Character Win Rates
                        </Typography>
                        <CharacterWinRateLogScatter data={charStats} />
                      </Box>
                    )}
                    {playerStats.length > 0 && (
                      <Box mb={3}>
                        <Typography variant="subtitle1" fontWeight="bold" mb={1} sx={{ color: "primary.main" }}>
                          Player Win Rates
                        </Typography>
                        <PlayerWinRateBar data={playerStats} />
                      </Box>
                    )}
                    {charStats.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" mb={1} sx={{ color: "primary.main" }}>
                          Character Details
                        </Typography>
                        <CharacterWinRateTable data={charStats} minRounds={1} />
                      </Box>
                    )}
                  </>
                );
              })()}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tournament</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{tournament.title}</strong>? This will
            permanently delete all bracket data, matches, and rounds. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : <Delete />}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
