import { Add, SportsEsports } from "@mui/icons-material";
import { Avatar, Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { useState } from "react";

import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import StyledButton from "../../app/shared/components/StyledButton";
import { SMASH_COLORS } from "../../app/theme";
import { useCasual } from "../../lib/hooks/useCasual";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { computeCharacterWinRates, computePlayerWinRates } from "../../lib/util/statUtils";
import { formatDate } from "../../lib/util/util";
import { CharacterWinRateLogScatter, CharacterWinRateTable, PlayerWinRateBar } from "../stats/charts";
import CasualMatchForm from "./CasualMatchForm";

export default function CasualPage() {
  const { casualMatches, isCasualLoading } = useCasual();
  const { characters } = useCharacters();
  const [formOpen, setFormOpen] = useState(false);

  if (isCasualLoading) return <LoadingSkeleton variant="list" count={5} />;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight="bold">
          Casual Matches
        </Typography>
        <StyledButton onClick={() => setFormOpen(true)}>
          <Add sx={{ mr: 0.5 }} /> New Match
        </StyledButton>
      </Box>

      {!casualMatches || casualMatches.length === 0 ? (
        <EmptyState
          icon={<SportsEsports sx={{ fontSize: 48 }} />}
          message="No casual matches yet — start one!"
          action={{ label: "New Match", onClick: () => setFormOpen(true) }}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {casualMatches.map((match) => {
            const p1Char = characters?.find(
              (c) => c.id === match.rounds[0]?.playerOneCharacterId,
            );
            const p2Char = characters?.find(
              (c) => c.id === match.rounds[0]?.playerTwoCharacterId,
            );
            const isP1Winner = match.winnerUserId === match.playerOne?.userId;

            return (
              <Card
                key={`${match.competitionId}-${match.bracketNumber}-${match.matchNumber}`}
                elevation={2}
                sx={{ borderRadius: 2 }}
              >
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    {/* Player One */}
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      flex={1}
                      minWidth={0}
                    >
                      {p1Char && (
                        <Avatar
                          src={p1Char.imageUrl}
                          alt={p1Char.shorthandName}
                          sx={{ width: 36, height: 36 }}
                        />
                      )}
                      <Box minWidth={0}>
                        <Typography
                          fontWeight={isP1Winner ? "bold" : "normal"}
                          noWrap
                          sx={{
                            color: isP1Winner
                              ? SMASH_COLORS.p4Green
                              : "text.primary",
                          }}
                        >
                          {match.playerOne?.displayName}
                        </Typography>
                      </Box>
                    </Box>

                    {/* VS */}
                    <Typography
                      variant="caption"
                      sx={{
                        mx: 1.5,
                        fontWeight: "bold",
                        color: "text.secondary",
                      }}
                    >
                      VS
                    </Typography>

                    {/* Player Two */}
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      flex={1}
                      minWidth={0}
                      justifyContent="flex-end"
                    >
                      <Box minWidth={0} textAlign="right">
                        <Typography
                          fontWeight={!isP1Winner ? "bold" : "normal"}
                          noWrap
                          sx={{
                            color: !isP1Winner
                              ? SMASH_COLORS.p4Green
                              : "text.primary",
                          }}
                        >
                          {match.playerTwo?.displayName}
                        </Typography>
                      </Box>
                      {p2Char && (
                        <Avatar
                          src={p2Char.imageUrl}
                          alt={p2Char.shorthandName}
                          sx={{ width: 36, height: 36 }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Footer */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={1}
                  >
                    <Chip
                      label={
                        isP1Winner
                          ? match.playerOne?.displayName
                          : match.playerTwo?.displayName
                      }
                      size="small"
                      sx={{
                        bgcolor: SMASH_COLORS.p4Green,
                        color: "white",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    />
                    {match.registeredTime && (
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(match.registeredTime)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Stats Section */}
      {casualMatches && casualMatches.length > 0 && characters && (
        <Box mt={4}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Stats
          </Typography>
          {(() => {
            const charStats = computeCharacterWinRates(casualMatches, characters);
            const players = [
              ...new Map(
                casualMatches.flatMap((m) =>
                  [m.playerOne, m.playerTwo]
                    .filter((p): p is Player => p != null)
                    .map((p) => [p.userId, { userId: p.userId, displayName: p.displayName }] as const),
                ),
              ).values(),
            ];
            const playerStats = computePlayerWinRates(casualMatches, players);
            return (
              <>
                {charStats.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h6" fontWeight="bold" mb={1} sx={{ color: "primary.main" }}>
                      Character Win Rates
                    </Typography>
                    <CharacterWinRateLogScatter data={charStats} />
                  </Box>
                )}
                {playerStats.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h6" fontWeight="bold" mb={1} sx={{ color: "primary.main" }}>
                      Player Win Rates
                    </Typography>
                    <PlayerWinRateBar data={playerStats} />
                  </Box>
                )}
                {charStats.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h6" fontWeight="bold" mb={1} sx={{ color: "primary.main" }}>
                      Character Details
                    </Typography>
                    <CharacterWinRateTable data={charStats} />
                  </Box>
                )}
              </>
            );
          })()}
        </Box>
      )}

      <CasualMatchForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
