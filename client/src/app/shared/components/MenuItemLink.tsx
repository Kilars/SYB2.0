import { MenuItem } from "@mui/material";
import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { SMASH_COLORS } from "../../theme";

export default function MenuItemLink({children, to}: {children: ReactNode, to: string}) {
  return (
    <MenuItem
        component={NavLink}
        to={to}
        sx={{
            fontSize: '1.2rem',
            textTransform: 'uppercase',
            color: 'inherit',
            fontWeight: 'bold',
            borderRadius: 1,
            transition: 'all 0.2s ease',
            '&.active': {
                color: SMASH_COLORS.p3Yellow,
                borderLeft: `4px solid ${SMASH_COLORS.p3Yellow}`,
                paddingLeft: 'calc(1rem - 4px)',
                background: 'rgba(255,255,255,0.08)',
            },
            '&:hover': {
                background: 'rgba(255,255,255,0.12)',
            },
        }}
    >
        {children}
    </MenuItem>
  )
}
