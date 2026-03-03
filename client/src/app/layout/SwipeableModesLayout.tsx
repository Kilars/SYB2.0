import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useSwipeable } from "react-swipeable";

import ModeIndicator from "../shared/components/ModeIndicator";

const MODES = ["/casual", "/leagues", "/tournaments"] as const;

export default function SwipeableModesLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = MODES.findIndex((m) => location.pathname === m);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isMobile || currentIndex < 0) return;
      const next = currentIndex + 1;
      if (next < MODES.length) navigate(MODES[next]);
    },
    onSwipedRight: () => {
      if (!isMobile || currentIndex < 0) return;
      const prev = currentIndex - 1;
      if (prev >= 0) navigate(MODES[prev]);
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  if (!isMobile) {
    return <Outlet />;
  }

  return (
    <Box {...handlers} sx={{ minHeight: "50vh" }}>
      <ModeIndicator modes={MODES} currentIndex={currentIndex} />
      <Outlet />
    </Box>
  );
}
