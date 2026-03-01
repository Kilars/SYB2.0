import { Box, Card, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { SportsEsports, CheckCircle, Cancel } from "@mui/icons-material";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import { SMASH_COLORS } from "../../app/theme";

export default function MatchesList() {
  const { leagueId } = useParams();
  const { league, isLeagueLoading } = useLeagues(leagueId);
  const { characters } = useCharacters();
  const navigate = useNavigate();
  if (isLeagueLoading) return <LoadingSkeleton variant="card" count={3} />
  if (!league || !characters) return (
    <EmptyState
      icon={<SportsEsports sx={{ fontSize: 48 }} />}
      message="No matches in this split"
    />
  )
  return (
    <Box>
      {league.matches.length === 0
        ? <EmptyState
            icon={<SportsEsports sx={{ fontSize: 48 }} />}
            message="No matches in this split"
          />
        :
        <Box display='flex' flexDirection='column' gap={2}>
          {league.matches.map(match => {
            const p1Wins = match.rounds.filter(r => r.winnerUserId === match.playerOne.userId).length;
            const p2Wins = match.rounds.filter(r => r.winnerUserId === match.playerTwo.userId).length;
            const winnerPlayer = match.winnerUserId === match.playerOne.userId
              ? match.playerOne
              : match.playerTwo;
            const winner = winnerPlayer.displayName + (winnerPlayer.isGuest ? ' (guest)' : '');

            return (
              <Box
                key={match.leagueId + match.split + match.matchNumber}
                component={Card}
                elevation={match.completed ? 1 : 3}
                p={2}
                onClick={() => navigate(`/leagues/${match.leagueId}/split/${match.split}/match/${match.matchNumber}`)}
                sx={{
                  cursor: 'pointer',
                  borderLeft: `4px solid ${match.completed ? SMASH_COLORS.p4Green : SMASH_COLORS.p2Blue}`,
                  opacity: match.completed ? 0.9 : 1,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                }}
              >
              <Box>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                  <Typography
                    variant="h4"
                    fontFamily="monospace"
                    fontStyle="italic"
                    sx={{
                      fontSize: { xs: '1.25rem', sm: '2.125rem' },
                      color: match.winnerUserId === match.playerOne.userId ? SMASH_COLORS.p1Red : 'text.primary',
                      fontWeight: match.winnerUserId === match.playerOne.userId ? 'bold' : 'normal',
                    }}
                  >
                    {match.playerOne.displayName}{match.playerOne.isGuest ? ' (guest)' : ''}
                  </Typography>
                  {match.completed
                    ? <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        px: 1.5, py: 0.5,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${SMASH_COLORS.p4Green}22, ${SMASH_COLORS.p4Green}44)`,
                        border: `1px solid ${SMASH_COLORS.p4Green}`,
                      }}>
                        <CheckCircle fontSize="small" sx={{ color: SMASH_COLORS.p4Green }} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: SMASH_COLORS.p4Green }}>
                          {p1Wins} — {p2Wins}
                        </Typography>
                      </Box>
                    : <Box sx={{
                        px: 1.5, py: 0.5,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p2Blue})`,
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>VS</Typography>
                      </Box>
                  }
                  <Typography
                    variant="h4"
                    fontFamily="monospace"
                    fontStyle="italic"
                    sx={{
                      fontSize: { xs: '1.25rem', sm: '2.125rem' },
                      color: match.winnerUserId === match.playerTwo.userId ? SMASH_COLORS.p2Blue : 'text.primary',
                      fontWeight: match.winnerUserId === match.playerTwo.userId ? 'bold' : 'normal',
                    }}
                  >
                    {match.playerTwo.displayName}{match.playerTwo.isGuest ? ' (guest)' : ''}
                  </Typography>
                </Box>
                <Box display='flex' flexDirection='row' justifyContent='space-between'>
                  <Box display='flex'>
                    {match.rounds.map(round => {
                      if (!round.playerOneCharacterId) return null;
                      const isWin = round.winnerUserId === match.playerOne.userId;
                      const character = characters.find(c => c.id === round.playerOneCharacterId);
                      return (
                        <Box
                          key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
                          sx={{
                            border: '3px solid',
                            borderRadius: 1,
                            m: 0.5,
                            borderColor: isWin ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red,
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative',
                            boxShadow: isWin ? `0 0 6px ${SMASH_COLORS.p4Green}66` : 'none',
                          }}
                        >
                          <img
                            alt={character?.fullName ?? ''}
                            style={{ width: 'clamp(40px, 10vw, 56px)', height: 'clamp(40px, 10vw, 56px)' }}
                            src={character?.imageUrl}
                          />
                          <Box sx={{ position: 'absolute', bottom: -2, right: -2 }}>
                            {isWin
                              ? <CheckCircle sx={{ color: SMASH_COLORS.p4Green, fontSize: 18 }} />
                              : <Cancel sx={{ color: SMASH_COLORS.p1Red, fontSize: 18 }} />
                            }
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  <Box display='flex'>
                    {match.rounds.map(round => {
                      if (!round.playerTwoCharacterId) return null;
                      const isWin = round.winnerUserId === match.playerTwo.userId;
                      const character = characters.find(c => c.id === round.playerTwoCharacterId);
                      return (
                        <Box
                          key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
                          sx={{
                            border: '3px solid',
                            borderRadius: 1,
                            m: 0.5,
                            borderColor: isWin ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red,
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative',
                            boxShadow: isWin ? `0 0 6px ${SMASH_COLORS.p4Green}66` : 'none',
                          }}
                        >
                          <img
                            alt={character?.fullName ?? ''}
                            style={{ width: 'clamp(40px, 10vw, 56px)', height: 'clamp(40px, 10vw, 56px)' }}
                            src={character?.imageUrl}
                          />
                          <Box sx={{ position: 'absolute', bottom: -2, right: -2 }}>
                            {isWin
                              ? <CheckCircle sx={{ color: SMASH_COLORS.p4Green, fontSize: 18 }} />
                              : <Cancel sx={{ color: SMASH_COLORS.p1Red, fontSize: 18 }} />
                            }
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                  <Typography> Match #{match.matchNumber} </Typography>
                  <Typography> Split {match.split} </Typography>
                </Box>
                <Box>
                  {match.completed
                    ? <Typography variant="body2" color="text.secondary">Winner: {winner}</Typography>
                    : <Typography variant="body2" sx={{ fontWeight: 'bold', color: SMASH_COLORS.p2Blue }}>Register result</Typography>
                  }
                </Box>
              </Box>
            </Box>
            );
          })}
        </Box>
      }
    </Box>
  )
}
