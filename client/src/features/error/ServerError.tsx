import { Divider, Paper, Typography } from "@mui/material";
import { useLocation } from "react-router"
import { SMASH_COLORS } from "../../app/theme";

export default function ServerError() {
  const { state } = useLocation();
  return (
    <Paper sx={{ borderTop: `4px solid ${SMASH_COLORS.p1Red}` }}>
        {state?.error ?
    <>
        <Typography gutterBottom variant="h3" sx={{px: 4, pt: 2, fontSize: { xs: '1.5rem', sm: '3rem' }}} color="secondary">
            {state.error?.message || 'There has been an error'}
        </Typography>
        <Divider />
        <Typography variant="body1" sx={{p: 4, wordBreak: 'break-word'}}>
            {state.error?.details || 'There has been an error'}
        </Typography>
    </>
    : (
      <Typography variant="h5" sx={{ p: 4 }}>Server error</Typography>
    )
    }
    </Paper>
  )
}
