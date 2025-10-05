import { AppBar, Box, CircularProgress, Container, Toolbar } from "@mui/material";
import MenuItemLink from "../shared/components/MenuItemLink";
import { useStore } from "../../lib/hooks/useStore";
import { observer } from "mobx-react-lite";
import { useAccount } from "../../lib/hooks/useAccount";
import UserMenu from "./UserMenu";

const NavBar = observer(function NavBar() {
  const { uiStore } = useStore();
  const { currentUser } = useAccount();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='fixed' sx={{
        backgroundImage: 'linear-gradient(135deg, #182a73 0%, #218aae 69%, #20a78c 89%)',
      }}>
        <Container maxWidth='xl'>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <MenuItemLink to='/'>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                {uiStore.isLoading && (
                  <CircularProgress
                    size={20}
                    thickness={7}
                    sx={{
                      color: 'white',
                      position: 'absolute',
                      top: '30%',
                      left: '105%'
                    }} />
                )}
              </Box>
            </MenuItemLink>
            <Box display='flex'>
              <Box>
                <MenuItemLink to='/leagues'>
                  Leagues
                </MenuItemLink>
              </Box>
            </Box>
            <Box display='flex' alignItems='center'>
              {currentUser
                ? <UserMenu />
                : (
                  <>
                    <MenuItemLink to="/login">login</MenuItemLink>
                    <MenuItemLink to="/register">register</MenuItemLink>
                  </>
                )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  )
});

export default NavBar;