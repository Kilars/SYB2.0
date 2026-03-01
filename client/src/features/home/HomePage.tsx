import { SportsEsports, EmojiEvents } from "@mui/icons-material";
import { Box, Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router";
import { APP_GRADIENT, SMASH_COLORS } from "../../app/theme";

export default function HomePage() {
  return (
    <Paper
      sx={{
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'center',
        alignContent: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundImage: APP_GRADIENT,
      }}
    >
      <SportsEsports sx={{ fontSize: 80, color: 'white' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', alignContent: 'center', color: 'white', gap: 3 }}>
        <Typography variant="h3" sx={{ fontSize: { xs: '1.75rem', sm: '3rem' } }}>
          Smash Your Bros
        </Typography>
      </Box>
      <Box>
        <Typography variant="h5" textAlign={'center'} mb={3} sx={{ opacity: 0.9 }}>
          Track your league — matches, stats, and bragging rights
        </Typography>
        <Button component={Link} to='/leagues' size="large" variant="contained"
          startIcon={<EmojiEvents />}
          sx={{
            height: 80, borderRadius: 4, fontSize: '1.0rem',
            background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p3Yellow})`,
            color: 'white',
            fontWeight: 'bold',
            '&:hover': {
              background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}dd, ${SMASH_COLORS.p3Yellow}dd)`,
            },
          }}>
          View Leagues
        </Button>
      </Box>
    </Paper>
  )
};
