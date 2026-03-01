import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import { SportsEsports } from "@mui/icons-material";
import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { useCharacters } from "../../lib/hooks/useCharacters";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import { SMASH_COLORS } from "../../app/theme";

export default function MatchDetailsView() {
  const { leagueId, split, match } = useParams();
  const { match: matchData, isMatchLoading, reopenMatch } = useMatch(
    leagueId || '',
    parseInt(split || ''),
    parseInt(match || '')
  );
  const { characters } = useCharacters();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isMatchLoading) return <LoadingSkeleton variant="detail" />;
  if (!matchData || !characters) return (
    <EmptyState
      icon={<SportsEsports sx={{ fontSize: 48 }} />}
      message="Match not found"
    />
  );

  const getDisplayName = (player: Player) => player.isGuest ? `${player.displayName} (guest)` : player.displayName;

  const completedRounds = matchData.rounds.filter(r => !!r.winnerUserId);
  const playerOneWins = completedRounds.filter(r => r.winnerUserId === matchData.playerOne.userId).length;
  const playerTwoWins = completedRounds.filter(r => r.winnerUserId === matchData.playerTwo.userId).length;
  const playerOneIsWinner = matchData.winnerUserId === matchData.playerOne.userId;
  const playerTwoIsWinner = matchData.winnerUserId === matchData.playerTwo.userId;

  const handleConfirmReopen = async () => {
    await reopenMatch.mutateAsync();
    setConfirmOpen(false);
  };

  return (
    <Box>
      {/* Score summary */}
      <Paper
        elevation={3}
        sx={{
          p: 3, mb: 3, textAlign: 'center',
          background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}15 0%, transparent 40%, ${SMASH_COLORS.p2Blue}15 100%)`,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" gap={2} flexWrap="wrap">
          <Typography
            variant="h5"
            fontWeight={playerOneIsWinner ? 'bold' : 'normal'}
            sx={{ color: playerOneIsWinner ? SMASH_COLORS.p1Red : 'text.primary' }}
          >
            {getDisplayName(matchData.playerOne)}
          </Typography>
          <Box sx={{
            px: 2, py: 0.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p2Blue})`,
          }}>
            <Typography variant="h5" fontWeight="bold" color="white">
              {playerOneWins} — {playerTwoWins}
            </Typography>
          </Box>
          <Typography
            variant="h5"
            fontWeight={playerTwoIsWinner ? 'bold' : 'normal'}
            sx={{ color: playerTwoIsWinner ? SMASH_COLORS.p2Blue : 'text.primary' }}
          >
            {getDisplayName(matchData.playerTwo)}
          </Typography>
        </Box>
      </Paper>

      {/* Round cards */}
      {completedRounds.map((round) => {
        const p1IsRoundWinner = round.winnerUserId === matchData.playerOne.userId;
        const p2IsRoundWinner = round.winnerUserId === matchData.playerTwo.userId;
        const p1Char = characters.find(c => c.id === round.playerOneCharacterId);
        const p2Char = characters.find(c => c.id === round.playerTwoCharacterId);

        return (
          <Card
            key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                Round {round.roundNumber}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                {/* Player One side */}
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: p1IsRoundWinner ? `${SMASH_COLORS.p1Red}18` : 'action.hover',
                    border: `2px solid ${p1IsRoundWinner ? SMASH_COLORS.p1Red : 'transparent'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="h6" sx={{ color: p1IsRoundWinner ? SMASH_COLORS.p1Red : 'text.primary' }}>
                    {getDisplayName(matchData.playerOne)}
                  </Typography>
                  {p1Char && (
                    <img
                      alt={p1Char.fullName}
                      style={{
                        width: 'clamp(40px, 10vw, 60px)',
                        height: 'clamp(40px, 10vw, 60px)',
                        borderRadius: 8,
                        border: `3px solid ${p1IsRoundWinner ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red}`,
                      }}
                      src={p1Char.imageUrl}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {p1Char?.fullName ?? round.playerOneCharacter?.fullName ?? '—'}
                  </Typography>
                  {p1IsRoundWinner && (
                    <Chip label="Winner" size="small"
                      sx={{ backgroundColor: SMASH_COLORS.p4Green, color: 'white', fontWeight: 'bold' }}
                    />
                  )}
                </Paper>

                {/* VS divider */}
                <Box sx={{
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Box sx={{
                    px: 1.5, py: 0.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p2Blue})`,
                  }}>
                    <Typography variant="body2" fontWeight="bold" color="white">VS</Typography>
                  </Box>
                </Box>

                {/* Player Two side */}
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: p2IsRoundWinner ? `${SMASH_COLORS.p2Blue}18` : 'action.hover',
                    border: `2px solid ${p2IsRoundWinner ? SMASH_COLORS.p2Blue : 'transparent'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="h6" sx={{ color: p2IsRoundWinner ? SMASH_COLORS.p2Blue : 'text.primary' }}>
                    {getDisplayName(matchData.playerTwo)}
                  </Typography>
                  {p2Char && (
                    <img
                      alt={p2Char.fullName}
                      style={{
                        width: 'clamp(40px, 10vw, 60px)',
                        height: 'clamp(40px, 10vw, 60px)',
                        borderRadius: 8,
                        border: `3px solid ${p2IsRoundWinner ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red}`,
                      }}
                      src={p2Char.imageUrl}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {p2Char?.fullName ?? round.playerTwoCharacter?.fullName ?? '—'}
                  </Typography>
                  {p2IsRoundWinner && (
                    <Chip label="Winner" size="small"
                      sx={{ backgroundColor: SMASH_COLORS.p4Green, color: 'white', fontWeight: 'bold' }}
                    />
                  )}
                </Paper>
              </Box>
            </CardContent>
          </Card>
        );
      })}

      {/* Reopen button */}
      <Button
        variant="contained"
        color="warning"
        fullWidth
        sx={{ mt: 3 }}
        onClick={() => setConfirmOpen(true)}
      >
        Reopen match
      </Button>

      {/* Confirmation dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="reopen-dialog-title"
        aria-describedby="reopen-dialog-description"
      >
        <DialogTitle id="reopen-dialog-title">Reopen Match?</DialogTitle>
        <DialogContent>
          <DialogContentText id="reopen-dialog-description">
            This will allow editing of match results. Are you sure?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmReopen}
            color="warning"
            variant="contained"
            disabled={reopenMatch.isPending}
          >
            Reopen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
