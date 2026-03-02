import { AccessTime, Delete, Group, SportsEsports } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";

import { useAppTheme } from "../../app/context/ThemeContext";
import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import { useAccount } from "../../lib/hooks/useAccount";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { COMPETITION_STATUSES, STATUS_BORDERS } from "../../lib/util/constants";
import { formatDate } from "../../lib/util/util";

export default function Description() {
  const { competitionId } = useParams();
  const { league, isLeagueLoading, deleteLeague } = useLeagues(competitionId);
  const { currentUser } = useAccount();
  const { meta } = useAppTheme();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin =
    currentUser && league?.members.some((m) => m.userId === currentUser.id && m.isAdmin);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteLeague.mutateAsync();
      toast("League deleted successfully", { type: "success" });
      navigate("/leagues");
    } catch {
      toast("Failed to delete league", { type: "error" });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };
  if (isLeagueLoading) return <LoadingSkeleton variant="detail" />;
  if (!league)
    return <EmptyState icon={<SportsEsports sx={{ fontSize: 48 }} />} message="League not found" />;

  const completedMatches = league.matches.filter((m) => m.completed).length;
  const totalMatches = league.matches.length;
  const progressPercent =
    totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <Box>
      <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
        <Chip
          label={COMPETITION_STATUSES[league.status][0]}
          color={league.status === 0 ? "warning" : league.status === 1 ? "success" : "info"}
          sx={{ mb: 2, fontWeight: "bold" }}
        />
      </Box>
      <Typography variant="body1" gutterBottom>
        {league.description}
      </Typography>

      <Box display="flex" gap={3} sx={{ flexWrap: "wrap" }}>
        <Box display="flex" alignItems="center" my={2}>
          <SportsEsports sx={{ mr: 2, color: "error.main" }} />
          <Typography variant="body1">Super Smash Bros</Typography>
        </Box>
        <Box display="flex" alignItems="center" my={2}>
          <AccessTime sx={{ mr: 2, color: "info.main" }} />
          <Typography variant="body1">{formatDate(league.startDate)}</Typography>
        </Box>
        <Box display="flex" alignItems="center" my={2}>
          <Group sx={{ mr: 2, color: "success.main" }} />
          <Typography variant="body1">{league.members.length} players</Typography>
        </Box>
      </Box>

      {/* Match completion progress */}
      {totalMatches > 0 && (
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mt: 2,
            border: `1px solid ${STATUS_BORDERS[league.status]}33`,
            borderRadius: 2,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" fontWeight="bold">
              Match Progress
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ color: STATUS_BORDERS[league.status] }}
            >
              {completedMatches} / {totalMatches} ({progressPercent}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: "action.hover",
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
                background: meta.accentGradient,
              },
            }}
          />
        </Paper>
      )}

      {/* Delete league — admin only */}
      {isAdmin && (
        <Box mt={4} display="flex" justifyContent="flex-end">
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete League
          </Button>
        </Box>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete League</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{league.title}</strong>? This will permanently
            delete all matches, rounds, and league data. This action cannot be undone.
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
