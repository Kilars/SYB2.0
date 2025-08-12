import { Box, Button, Typography } from "@mui/material";
import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";

export default function MatchDetailsView() {
  const { id } = useParams();
  const { match, isMatchLoading, reopenMatch } = useMatch(id || '');

  if (isMatchLoading) return <Typography>Loading...</Typography>
  if (!match) return <Typography>Match not found...</Typography>
  return (
    <Box>MatchDetailsView


      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
        onClick={async () => await reopenMatch.mutateAsync()}
      >
        Reopen match
      </Button>
    </Box>
  )
}
