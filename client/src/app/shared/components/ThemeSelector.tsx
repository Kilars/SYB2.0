import { Check } from "@mui/icons-material";
import { Box, MenuItem, Typography } from "@mui/material";

import { useAppTheme } from "../../context/ThemeContext";
import { THEMES } from "../../theme";

export default function ThemeSelector() {
  const { themeId, setThemeId } = useAppTheme();

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          px: 2,
          py: 0.5,
          display: "block",
          color: "text.secondary",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: "0.7rem",
        }}
      >
        Theme
      </Typography>
      {Object.values(THEMES).map(({ meta }) => (
        <MenuItem
          key={meta.id}
          selected={themeId === meta.id}
          onClick={() => setThemeId(meta.id)}
          sx={{
            gap: 1.5,
            minWidth: 180,
            borderRadius: 1,
            mx: 0.5,
            "&.Mui-selected": {
              fontWeight: "bold",
            },
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: meta.navGradient,
              border: "2px solid",
              borderColor: themeId === meta.id ? "primary.main" : "divider",
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {meta.emoji} {meta.label}
          </Typography>
          {themeId === meta.id && <Check sx={{ fontSize: 18, color: "primary.main" }} />}
        </MenuItem>
      ))}
    </Box>
  );
}
