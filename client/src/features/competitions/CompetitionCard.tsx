import { Box, Card, CardActions, CardContent, CardHeader, Chip } from "@mui/material";
import { type ReactNode } from "react";

import { COMPETITION_STATUSES, STATUS_BORDERS } from "../../lib/util/constants";

interface CompetitionCardProps {
  competition: Competition;
  children?: ReactNode;
  actions: ReactNode;
}

export default function CompetitionCard({ competition, children, actions }: CompetitionCardProps) {
  return (
    <Card
      component={Box}
      p={1}
      m={1}
      role="article"
      aria-label={`${competition.title} — ${COMPETITION_STATUSES[competition.status][0]}`}
      sx={{
        borderLeft: `4px solid ${STATUS_BORDERS[competition.status]}`,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        },
      }}
    >
      <CardHeader
        title={competition.title}
        titleTypographyProps={{ fontWeight: "bold" }}
        action={
          <Chip
            label={COMPETITION_STATUSES[competition.status][0]}
            color={
              competition.status === 0 ? "warning" : competition.status === 1 ? "success" : "info"
            }
            sx={{ fontWeight: "bold" }}
          />
        }
      />
      <CardContent>{children}</CardContent>
      <CardActions>
        <Box gap={1} display="flex" justifyContent="flex-end" width="100%" flexWrap="wrap">
          {actions}
        </Box>
      </CardActions>
    </Card>
  );
}
