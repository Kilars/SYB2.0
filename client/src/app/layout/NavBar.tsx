import { AppBar, Box, Button, Container, Divider, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
import MenuItemLink from "../shared/components/MenuItemLink";
import ThemeSelector from "../shared/components/ThemeSelector";
import { observer } from "mobx-react-lite";
import { useAccount } from "../../lib/hooks/useAccount";
import { Add, Menu as MenuIcon, Person, SportsEsports } from "@mui/icons-material";
import { useState } from "react";
import { NavLink } from "react-router";
import { useAppTheme } from "../context/ThemeContext";

const NavBar = observer(function NavBar() {
  const { currentUser } = useAccount();
  const { meta } = useAppTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 1, width: '100%' }}>
      <AppBar position='fixed' sx={{
        backgroundImage: meta.navGradient,
        boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Container maxWidth='xl'>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <SportsEsports sx={{ color: 'white', fontSize: 28 }} />
              <Typography
                variant="h6"
                component={NavLink}
                to="/"
                sx={{
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  letterSpacing: '0.05em',
                  mr: 3,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                SYB
              </Typography>
              <MenuItemLink to='/leagues'> Leagues </MenuItemLink>
            </Box>
            <Box>
              <Button onClick={handleClick} sx={{ color: 'white' }} aria-label="Open navigation menu"> <MenuIcon /> </Button>
            </Box>
            <Menu
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              slotProps={{
                paper: {
                  sx: {
                    minWidth: 220,
                    borderRadius: 2,
                    mt: 1,
                  },
                },
              }}
            >
              {currentUser
                ? <MenuItem component={NavLink} to={`/user/${currentUser.id}`} onClick={handleClose}>
                    <Person sx={{ mr: 1 }} fontSize="small" />
                    My Profile
                  </MenuItem>
                : (
                  <Box>
                    <MenuItem component={NavLink} to="/login" onClick={handleClose}>Login</MenuItem>
                    <MenuItem component={NavLink} to="/register" onClick={handleClose}>Register</MenuItem>
                  </Box>
                )}
              {currentUser && (
                <MenuItem component={NavLink} to="/createLeague" onClick={handleClose}>
                  <Add sx={{ mr: 1 }} fontSize="small" /> Create League
                </MenuItem>
              )}
              <Divider sx={{ my: 1 }} />
              <ThemeSelector />
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  )
});

export default NavBar;
