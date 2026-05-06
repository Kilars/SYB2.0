import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import z from "zod/v4";

import { useAppTheme } from "../../app/context/ThemeContext";
import { SMASH_COLORS } from "../../app/theme";
import CharacterSelect from "./CharacterSelect";

interface MatchDetailsFormProps {
  matchData: Match;
  onComplete: (rounds: Round[]) => Promise<void>;
  schema: z.ZodType<unknown>;
}

export default function MatchDetailsForm({ matchData, onComplete, schema }: MatchDetailsFormProps) {
  const { meta } = useAppTheme();
  const [rounds, setRounds] = useState(matchData.rounds);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRounds(matchData.rounds);
  }, [matchData]);

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      schema.parse(rounds);
      await onComplete(rounds);
      const { playerOne: p1, playerTwo: p2 } = matchData;
      if (p1 && p2) {
        const p1Score = rounds.filter((r) => r.winnerUserId === p1.userId).length;
        const p2Score = rounds.filter((r) => r.winnerUserId === p2.userId).length;
        const winner = p1Score > p2Score ? getDisplayName(p1) : getDisplayName(p2);
        toast(`${winner} wins ${Math.max(p1Score, p2Score)}–${Math.min(p1Score, p2Score)}!`, { type: "success" });
      } else {
        toast("Match completed!", { type: "success" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          toast(issue.message, { type: "error" });
        }
      } else toast("Server error", { type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { playerOne, playerTwo } = matchData;
  if (!playerOne || !playerTwo) return null;

  const getDisplayName = (player: Player) =>
    player.isGuest ? `${player.displayName} (guest)` : player.displayName;

  const playerOneScore = rounds.filter((r) => r.winnerUserId === playerOne.userId).length;
  const playerTwoScore = rounds.filter((r) => r.winnerUserId === playerTwo.userId).length;
  const requiredWins = Math.ceil(rounds.length / 2);
  const matchDecided = playerOneScore >= requiredWins || playerTwoScore >= requiredWins;

  function getRoundStatus(round: Round): "complete" | "partial" | "empty" {
    const filledFields = [
      round.playerOneCharacterId,
      round.playerTwoCharacterId,
      round.winnerUserId,
    ].filter(Boolean).length;
    if (filledFields === 3) return "complete";
    if (filledFields > 0) return "partial";
    return "empty";
  }

  const ROUND_STATUS_COLORS = {
    complete: SMASH_COLORS.p4Green,
    partial: SMASH_COLORS.p3Yellow,
    empty: "transparent",
  };

  return (
    <Box>
      <Typography
        variant="h4"
        mb={2}
        fontWeight="bold"
        sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
      >
        Register Match Result
      </Typography>

      {/* Match score indicator */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          textAlign: "center",
          background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}15 0%, transparent 40%, ${SMASH_COLORS.p2Blue}15 100%)`,
          overflow: "hidden",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={{ xs: 1, sm: 2 }}
          flexWrap="wrap"
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            noWrap
            sx={{
              color: playerOneScore > playerTwoScore ? SMASH_COLORS.p1Red : "text.primary",
              fontSize: { xs: "1rem", sm: "1.5rem" },
              maxWidth: { xs: "30vw", sm: "none" },
            }}
          >
            {getDisplayName(playerOne)}
          </Typography>
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 2,
              background: meta.accentGradient,
            }}
          >
            <Typography variant="h5" fontWeight="bold" color="white">
              {playerOneScore} — {playerTwoScore}
            </Typography>
          </Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            noWrap
            sx={{
              color: playerTwoScore > playerOneScore ? SMASH_COLORS.p2Blue : "text.primary",
              fontSize: { xs: "1rem", sm: "1.5rem" },
              maxWidth: { xs: "30vw", sm: "none" },
            }}
          >
            {getDisplayName(playerTwo)}
          </Typography>
        </Box>
      </Paper>

      {/* Round progress indicators */}
      <Box display="flex" justifyContent="center" gap={2} mb={3}>
        {rounds.map((round, i) => {
          const status = getRoundStatus(round);
          return (
            <Box key={i} display="flex" flexDirection="column" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: ROUND_STATUS_COLORS[status],
                  border: `2px solid ${status === "empty" ? "#ccc" : ROUND_STATUS_COLORS[status]}`,
                  transition: "all 0.2s ease",
                }}
              />
              <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
                R{round.roundNumber}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {rounds.map((round, i) => {
        const roundStatus = getRoundStatus(round);
        const isDecidedEarly = matchDecided && !round.winnerUserId;
        const borderColor = ROUND_STATUS_COLORS[roundStatus];

        // Compute which characters are locked out for each player in this round:
        // any character used in an earlier round (lower index) that already has a winner set.
        const playerOneDisabled = rounds
          .filter((r, idx) => idx < i && r.winnerUserId && r.playerOneCharacterId)
          .map((r) => r.playerOneCharacterId as string);
        const playerTwoDisabled = rounds
          .filter((r, idx) => idx < i && r.winnerUserId && r.playerTwoCharacterId)
          .map((r) => r.playerTwoCharacterId as string);

        return (
          <Card
            key={round.competitionId + round.bracketNumber + round.matchNumber + round.roundNumber}
            variant="outlined"
            sx={{
              opacity: isDecidedEarly ? 0.5 : 1,
              mb: 2,
              borderLeft: `4px solid ${borderColor}`,
              transition: "border-color 0.3s ease",
            }}
          >
            <CardContent>
              {/* Round header with inline validation icon */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="h5" fontWeight="bold">
                  Round {round.roundNumber}
                </Typography>
                {roundStatus === "complete" && (
                  <CheckCircleOutlineIcon sx={{ color: SMASH_COLORS.p4Green }} />
                )}
                {roundStatus === "partial" && (
                  <WarningAmberIcon sx={{ color: SMASH_COLORS.p3Yellow }} />
                )}
                {isDecidedEarly && (
                  <Typography variant="body2" sx={{ color: "text.secondary", ml: 1 }}>
                    Match already decided
                  </Typography>
                )}
              </Box>

              {/* Player columns — responsive: stacked on mobile, side-by-side on sm+ */}
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: SMASH_COLORS.p1Red }}>
                    {getDisplayName(playerOne)}
                  </Typography>
                  <CharacterSelect
                    onChange={(id) =>
                      setRounds((originalRounds) =>
                        originalRounds.map((r, index) =>
                          index === i ? { ...r, playerOneCharacterId: id } : r,
                        ),
                      )
                    }
                    selectedId={round.playerOneCharacterId}
                    userId={playerOne.userId}
                    disabledIds={playerOneDisabled}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: SMASH_COLORS.p2Blue }}>
                    {getDisplayName(playerTwo)}
                  </Typography>
                  <CharacterSelect
                    onChange={(id) =>
                      setRounds((originalRounds) =>
                        originalRounds.map((r, index) =>
                          index === i ? { ...r, playerTwoCharacterId: id } : r,
                        ),
                      )
                    }
                    selectedId={round.playerTwoCharacterId}
                    userId={playerTwo.userId}
                    disabledIds={playerTwoDisabled}
                  />
                </Box>
              </Box>

              {/* Single winner toggle spanning full width */}
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, color: "text.secondary", fontWeight: 600 }}
                >
                  Who won Round {round.roundNumber}?
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={round.winnerUserId ?? null}
                  onChange={(_, newValue) => {
                    setRounds((prev) =>
                      prev.map((r, idx) =>
                        idx === i ? { ...r, winnerUserId: newValue ?? undefined } : r,
                      ),
                    );
                  }}
                  aria-label={`Round ${round.roundNumber} winner selection`}
                  sx={{
                    "& .Mui-selected": {
                      fontWeight: "bold",
                    },
                  }}
                >
                  <ToggleButton
                    value={playerOne.userId}
                    aria-label={`${getDisplayName(playerOne)} wins round ${round.roundNumber}`}
                    sx={{
                      "&.Mui-selected": {
                        backgroundColor: `${SMASH_COLORS.p1Red}22`,
                        borderColor: SMASH_COLORS.p1Red,
                        color: SMASH_COLORS.p1Red,
                      },
                    }}
                  >
                    {getDisplayName(playerOne)}
                  </ToggleButton>
                  <ToggleButton
                    value={playerTwo.userId}
                    aria-label={`${getDisplayName(playerTwo)} wins round ${round.roundNumber}`}
                    sx={{
                      "&.Mui-selected": {
                        backgroundColor: `${SMASH_COLORS.p2Blue}22`,
                        borderColor: SMASH_COLORS.p2Blue,
                        color: SMASH_COLORS.p2Blue,
                      },
                    }}
                  >
                    {getDisplayName(playerTwo)}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </CardContent>
          </Card>
        );
      })}

      <Button
        variant="contained"
        fullWidth
        sx={{
          mt: 3,
          py: 1.5,
          fontWeight: "bold",
          fontSize: "1rem",
          background: matchDecided ? meta.accentGradient : undefined,
          backgroundColor: matchDecided ? undefined : "action.disabledBackground",
          color: matchDecided ? "white" : "text.secondary",
          "&:hover": matchDecided ? { opacity: 0.85 } : {},
          transition: "all 0.3s ease",
        }}
        disabled={isSubmitting}
        startIcon={
          isSubmitting ? (
            <CircularProgress size={20} />
          ) : matchDecided ? (
            <CheckCircleOutlineIcon />
          ) : undefined
        }
        onClick={() => onSubmit()}
      >
        {isSubmitting ? "Completing..." : matchDecided ? "Complete Match" : "Fill in rounds to complete"}
      </Button>
    </Box>
  );
}
