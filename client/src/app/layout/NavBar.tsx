import { Add, EmojiEvents, Logout, Menu as MenuIcon, Person, SportsEsports } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { NavLink } from "react-router";

import { useAccount } from "../../lib/hooks/useAccount";
import { useAppTheme } from "../context/ThemeContext";
import MenuItemLink from "../shared/components/MenuItemLink";
import ThemeSelector from "../shared/components/ThemeSelector";

const NavBar = observer(function NavBar() {
  const { currentUser, logoutUser } = useAccount();
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
    <Box sx={{ flexGrow: 1, width: "100%" }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundImage: meta.navGradient,
          boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}>
              <Box sx={{ marginRight: { xs: 1, sm: 3 } }}>
              <NavLink
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                  minHeight: 44,
                  minWidth: 44,
                }}
              >
                <SportsEsports sx={{ color: "white", fontSize: 28 }} />
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    letterSpacing: "0.05em",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  SYB
                </Typography>
              </NavLink>
              </Box>
              <MenuItemLink to="/casual"> Casual </MenuItemLink>
              <MenuItemLink to="/leagues"> Leagues </MenuItemLink>
              <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                <MenuItemLink to="/tournaments"> Tournaments </MenuItemLink>
              </Box>
            </Box>
            <Box>
              <Button
                onClick={handleClick}
                sx={{ color: "white" }}
                aria-label="Open navigation menu"
              >
                {" "}
                <MenuIcon />{" "}
              </Button>
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
              {currentUser ? (
                <MenuItem component={NavLink} to={`/user/${currentUser.id}`} onClick={handleClose}>
                  <Person sx={{ mr: 1 }} fontSize="small" />
                  My Profile
                </MenuItem>
              ) : (
                <Box>
                  <MenuItem component={NavLink} to="/login" onClick={handleClose}>
                    Login
                  </MenuItem>
                  <MenuItem component={NavLink} to="/register" onClick={handleClose}>
                    Register
                  </MenuItem>
                </Box>
              )}
              {currentUser && (
                <MenuItem
                  component={NavLink}
                  to="/tournaments"
                  onClick={handleClose}
                  sx={{ display: { xs: "flex", sm: "none" } }}
                >
                  <EmojiEvents sx={{ mr: 1 }} fontSize="small" /> Tournaments
                </MenuItem>
              )}
              {currentUser && (
                <MenuItem component={NavLink} to="/createLeague" onClick={handleClose}>
                  <Add sx={{ mr: 1 }} fontSize="small" /> Create League
                </MenuItem>
              )}
              {currentUser && (
                <MenuItem component={NavLink} to="/createTournament" onClick={handleClose}>
                  <EmojiEvents sx={{ mr: 1 }} fontSize="small" /> Create Tournament
                </MenuItem>
              )}
              {currentUser && (
                <MenuItem
                  onClick={() => {
                    logoutUser.mutate();
                    handleClose();
                  }}
                >
                  <Logout sx={{ mr: 1 }} fontSize="small" /> Logout
                </MenuItem>
              )}
              <Divider sx={{ my: 1 }} />
              <ThemeSelector />
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
});

export default NavBar;
