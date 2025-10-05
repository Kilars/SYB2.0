import { Group } from "@mui/icons-material";
import { Box, Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router";

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
        backgroundImage: 'linear-gradient(135deg, #182a73 0%, #218aae 69%, #20a78c 89%)',
      }}
    >
      <Group sx={{ height: 50, width: 50 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', alignContent: 'center', color: 'white', gap: 3 }}>
        <Typography variant="h3">
          Smash Your Bros
        </Typography>
      </Box>
      <Box>
        <Typography variant="h5" textAlign={'center'} mb={3}>
          Welcome to SYB 2.0
        </Typography>
        <Button component={Link} to='/leagues' size="large" variant="contained"
          sx={{ height: 80, borderRadius: 4, fontSize: '1.0rem' }}>
          Take me to the leagues
        </Button>
      </Box>
    </Paper>
  )
};