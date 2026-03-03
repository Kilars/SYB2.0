import { Cancel, CheckCircle, SportsEsports } from "@mui/icons-material";
import { Box, Card, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";

import { useAppTheme } from "../../app/context/ThemeContext";
import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import { SMASH_COLORS } from "../../app/theme";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { useLeagues } from "../../lib/hooks/useLeagues";

export default function MatchesList() {
  const { competitionId } = useParams();
  const { league, isLeagueLoading } = useLeagues(competitionId);
  const { characters } = useCharacters();
  const navigate = useNavigate();
  const { meta } = useAppTheme();
  if (isLeagueLoading) return <LoadingSkeleton variant="card" count={3} />;
  if (!league || !characters)
    return (
      <EmptyState
        icon={<SportsEsports sx={{ fontSize: 48 }} />}
        message="No matches in this split"
      />
    );
  return (
    <Box>
      {league.matches.length === 0 ? (
        <EmptyState
          icon={<SportsEsports sx={{ fontSize: 48 }} />}
          message="No matches in this split"
        />
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          gap={2}
          sx={{
            maxHeight: "75vh",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
            pr: 0.5,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              borderRadius: 3,
              backgroundColor: "action.hover",
            },
            "&::-webkit-scrollbar-thumb": {
              borderRadius: 3,
              backgroundColor: "text.disabled",
            },
          }}
        >
          {league.matches.map((match) => {
            if (!match.playerOne || !match.playerTwo) return null;
            const { playerOne, playerTwo } = match;
            const p1Wins = match.rounds.filter((r) => r.winnerUserId === playerOne.userId).length;
            const p2Wins = match.rounds.filter((r) => r.winnerUserId === playerTwo.userId).length;
            const winnerPlayer = match.winnerUserId === playerOne.userId ? playerOne : playerTwo;
            const winner = winnerPlayer.displayName + (winnerPlayer.isGuest ? " (guest)" : "");

            return (
              <Box
                key={match.competitionId + match.bracketNumber + match.matchNumber}
                component={Card}
                elevation={match.completed ? 1 : 3}
                p={{ xs: 2, sm: 3 }}
                role="link"
                tabIndex={0}
                aria-label={`Match #${match.matchNumber}: ${playerOne.displayName} vs ${playerTwo.displayName}${match.completed ? ` — Winner: ${winner}` : " — Pending"}`}
                onClick={() =>
                  navigate(
                    `/leagues/${match.competitionId}/bracket/${match.bracketNumber}/match/${match.matchNumber}`,
                  )
                }
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(
                      `/leagues/${match.competitionId}/bracket/${match.bracketNumber}/match/${match.matchNumber}`,
                    );
                  }
                }}
                sx={{
                  cursor: "pointer",
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: 2,
                  },
                  borderLeft: `4px solid ${match.completed ? SMASH_COLORS.p4Green : SMASH_COLORS.p2Blue}`,
                  opacity: match.completed ? 0.9 : 1,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
                    overflow="hidden"
                  >
                    <Typography
                      variant="h4"
                      fontFamily="monospace"
                      fontStyle="italic"
                      sx={{
                        fontSize: { xs: "1rem", sm: "1.75rem", md: "2.125rem" },
                        color:
                          match.winnerUserId === playerOne.userId
                            ? SMASH_COLORS.p1Red
                            : "text.primary",
                        fontWeight: match.winnerUserId === playerOne.userId ? "bold" : "normal",
                        flex: 1,
                        minWidth: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {playerOne.displayName}
                      {playerOne.isGuest ? " (guest)" : ""}
                    </Typography>
                    {match.completed ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${SMASH_COLORS.p4Green}22, ${SMASH_COLORS.p4Green}44)`,
                          border: `1px solid ${SMASH_COLORS.p4Green}`,
                        }}
                      >
                        <CheckCircle fontSize="small" sx={{ color: SMASH_COLORS.p4Green }} />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "bold", color: SMASH_COLORS.p4Green }}
                        >
                          {p1Wins} — {p2Wins}
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          background: meta.accentGradient,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "white" }}>
                          VS
                        </Typography>
                      </Box>
                    )}
                    <Typography
                      variant="h4"
                      fontFamily="monospace"
                      fontStyle="italic"
                      sx={{
                        fontSize: { xs: "1rem", sm: "1.75rem", md: "2.125rem" },
                        color:
                          match.winnerUserId === playerTwo.userId
                            ? SMASH_COLORS.p2Blue
                            : "text.primary",
                        fontWeight: match.winnerUserId === playerTwo.userId ? "bold" : "normal",
                        flex: 1,
                        minWidth: 0,
                        textAlign: "right",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {playerTwo.displayName}
                      {playerTwo.isGuest ? " (guest)" : ""}
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Box display="flex">
                      {match.rounds.map((round) => {
                        if (!round.playerOneCharacterId) return null;
                        const isWin = round.winnerUserId === playerOne.userId;
                        const character = characters.find(
                          (c) => c.id === round.playerOneCharacterId,
                        );
                        return (
                          <Box
                            key={
                              round.competitionId +
                              round.bracketNumber +
                              round.matchNumber +
                              round.roundNumber
                            }
                            sx={{
                              border: "3px solid",
                              borderRadius: 1,
                              m: 0.5,
                              borderColor: isWin ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red,
                              display: "flex",
                              alignItems: "center",
                              position: "relative",
                              boxShadow: isWin ? `0 0 6px ${SMASH_COLORS.p4Green}66` : "none",
                            }}
                          >
                            <img
                              alt={character?.fullName ?? ""}
                              style={{
                                width: "clamp(48px, 12vw, 64px)",
                                height: "clamp(48px, 12vw, 64px)",
                              }}
                              src={character?.imageUrl}
                            />
                            <Box sx={{ position: "absolute", bottom: -2, right: -2 }}>
                              {isWin ? (
                                <CheckCircle sx={{ color: SMASH_COLORS.p4Green, fontSize: 18 }} />
                              ) : (
                                <Cancel sx={{ color: SMASH_COLORS.p1Red, fontSize: 18 }} />
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                    <Box display="flex">
                      {match.rounds.map((round) => {
                        if (!round.playerTwoCharacterId) return null;
                        const isWin = round.winnerUserId === playerTwo.userId;
                        const character = characters.find(
                          (c) => c.id === round.playerTwoCharacterId,
                        );
                        return (
                          <Box
                            key={
                              round.competitionId +
                              round.bracketNumber +
                              round.matchNumber +
                              round.roundNumber
                            }
                            sx={{
                              border: "3px solid",
                              borderRadius: 1,
                              m: 0.5,
                              borderColor: isWin ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red,
                              display: "flex",
                              alignItems: "center",
                              position: "relative",
                              boxShadow: isWin ? `0 0 6px ${SMASH_COLORS.p4Green}66` : "none",
                            }}
                          >
                            <img
                              alt={character?.fullName ?? ""}
                              style={{
                                width: "clamp(48px, 12vw, 64px)",
                                height: "clamp(48px, 12vw, 64px)",
                              }}
                              src={character?.imageUrl}
                            />
                            <Box sx={{ position: "absolute", bottom: -2, right: -2 }}>
                              {isWin ? (
                                <CheckCircle sx={{ color: SMASH_COLORS.p4Green, fontSize: 18 }} />
                              ) : (
                                <Cancel sx={{ color: SMASH_COLORS.p1Red, fontSize: 18 }} />
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}
                >
                  <Box>
                    <Typography> Match #{match.matchNumber} </Typography>
                    <Typography> Split {match.bracketNumber} </Typography>
                  </Box>
                  <Box>
                    {match.completed ? (
                      <Typography variant="body2" color="text.secondary">
                        Winner: {winner}
                      </Typography>
                    ) : (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          background: meta.accentGradient,
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "0.8rem",
                        }}
                      >
                        <SportsEsports sx={{ fontSize: 16 }} />
                        Play
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
