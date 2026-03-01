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
      <Paper elevation={2} sx={{ p: 2, mb: 3, textAlign: 'center' }}>
        <Typography variant="h5">
          <Box component="span" fontWeight={playerOneIsWinner ? 'bold' : 'normal'} color={playerOneIsWinner ? 'success.main' : 'text.primary'}>
            {getDisplayName(matchData.playerOne)}
          </Box>
          {' '}
          {playerOneWins} — {playerTwoWins}
          {' '}
          <Box component="span" fontWeight={playerTwoIsWinner ? 'bold' : 'normal'} color={playerTwoIsWinner ? 'success.main' : 'text.primary'}>
            {getDisplayName(matchData.playerTwo)}
          </Box>
        </Typography>
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
                    borderRadius: 1,
                    bgcolor: p1IsRoundWinner ? 'success.light' : 'action.hover',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="h6">{getDisplayName(matchData.playerOne)}</Typography>
                  {p1Char && (
                    <img
                      alt={p1Char.fullName}
                      style={{ width: 'clamp(35px, 8vw, 50px)', height: 'clamp(35px, 8vw, 50px)' }}
                      src={p1Char.imageUrl}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {p1Char?.fullName ?? round.playerOneCharacter?.fullName ?? '—'}
                  </Typography>
                  {p1IsRoundWinner && (
                    <Chip label="Winner" color="success" size="small" />
                  )}
                </Paper>

                {/* Player Two side */}
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: p2IsRoundWinner ? 'success.light' : 'action.hover',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="h6">{getDisplayName(matchData.playerTwo)}</Typography>
                  {p2Char && (
                    <img
                      alt={p2Char.fullName}
                      style={{ width: 'clamp(35px, 8vw, 50px)', height: 'clamp(35px, 8vw, 50px)' }}
                      src={p2Char.imageUrl}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {p2Char?.fullName ?? round.playerTwoCharacter?.fullName ?? '—'}
                  </Typography>
                  {p2IsRoundWinner && (
                    <Chip label="Winner" color="success" size="small" />
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
