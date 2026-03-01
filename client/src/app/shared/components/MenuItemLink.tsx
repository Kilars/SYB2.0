import { MenuItem } from "@mui/material";
import type { ReactNode } from "react";
import { NavLink } from "react-router";

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
            '&.active': {
                color: '#90caf9',
                borderLeft: '4px solid #90caf9',
                paddingLeft: 'calc(1rem - 4px)'
            }
        }}
    >
        {children}
    </MenuItem>
  )
}