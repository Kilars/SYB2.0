import { AppBar, Box, Button, Container, Menu, MenuItem, Toolbar } from "@mui/material";
import MenuItemLink from "../shared/components/MenuItemLink";
import { observer } from "mobx-react-lite";
import { useAccount } from "../../lib/hooks/useAccount";
import { Add, Menu as MenuIcon } from "@mui/icons-material";
import { useState } from "react";
import { NavLink } from "react-router";

const NavBar = observer(function NavBar() {
  const { currentUser } = useAccount();
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
        backgroundImage: 'linear-gradient(135deg, #182a73 0%, #218aae 69%, #20a78c 89%)',
      }}>
        <Container maxWidth='xl'>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ flexGrow: 1 }}>
              <MenuItemLink to='/leagues'> Leagues </MenuItemLink>
            </Box>
            <Box>
              <Button onClick={handleClick} sx={{ color: 'white' }}> <MenuIcon /> </Button>
            </Box>
            <Menu
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              sx={{textDecoration: 'none'}}
            >
              {currentUser
                ? <MenuItem component={NavLink} to={`/user/${currentUser.id}`}>My Profile</MenuItem>
                : (
                  <>
                    <MenuItem component={NavLink} to="/login">login</MenuItem>
                    <MenuItem component={NavLink} to="/register">register</MenuItem>
                  </>
                )}
              {currentUser && <MenuItem component={NavLink} to="/createLeague">Create League <Add /> </MenuItem>}
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  )
});

export default NavBar;