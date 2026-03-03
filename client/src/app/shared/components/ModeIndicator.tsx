import { Box } from "@mui/material";
import { useNavigate } from "react-router";

import { SMASH_COLORS } from "../../theme";

type Props = {
  modes: readonly string[];
  currentIndex: number;
};

export default function ModeIndicator({ modes, currentIndex }: Props) {
  const navigate = useNavigate();

  if (currentIndex < 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        gap: 1,
        mb: 2,
      }}
    >
      {modes.map((mode, i) => (
        <Box
          key={mode}
          data-testid="mode-dot"
          onClick={() => navigate(mode)}
          sx={{
            width: i === currentIndex ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === currentIndex ? SMASH_COLORS.p3Yellow : "action.disabled",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </Box>
  );
}
