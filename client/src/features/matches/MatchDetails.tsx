import { ArrowBack, SportsEsports } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router";

import AppBreadcrumbs from "../../app/shared/components/AppBreadcrumbs";
import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import { useCompetitionMatch } from "../../lib/hooks/useCompetitionMatch";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useTournaments } from "../../lib/hooks/useTournaments";
import { matchSchema, tournamentMatchSchema } from "../../lib/schemas/matchSchema";
import MatchDetailsForm from "./MatchDetailsForm";
import MatchDetailsView from "./MatchDetailsView";

interface MatchDetailsProps {
  type: "league" | "tournament";
}

export default function MatchDetails({ type }: MatchDetailsProps) {
  const { competitionId, bracketNumber, matchNumber } = useParams();
  const {
    match: matchData,
    isMatchLoading,
    completeMatch,
    reopenMatch,
  } = useCompetitionMatch(
    type,
    competitionId || "",
    parseInt(bracketNumber || "0"),
    parseInt(matchNumber || "0"),
  );

  const { league } = useLeagues(type === "league" ? competitionId : undefined);
  const { tournament } = useTournaments(type === "tournament" ? competitionId : undefined);
  const competition = league ?? tournament;

  if (isMatchLoading) return <LoadingSkeleton variant="detail" />;
  if (!matchData)
    return <EmptyState icon={<SportsEsports sx={{ fontSize: 48 }} />} message="Match not found" />;
  if (!matchData.playerOne || !matchData.playerTwo)
    return (
      <EmptyState
        icon={<SportsEsports sx={{ fontSize: 48 }} />}
        message="Match players not found"
      />
    );

  const isLeague = type === "league";
  const backUrl = isLeague
    ? `/leagues/${competitionId}/matches`
    : `/tournaments/${competitionId}`;
  const backLabel = isLeague ? "Back to matches" : "Back to Bracket";

  const breadcrumbItems = isLeague
    ? [
        { label: "Leagues", href: "/leagues" },
        { label: competition?.title ?? "...", href: `/leagues/${competitionId}/leaderboard` },
        { label: `Match #${matchNumber}` },
      ]
    : [
        { label: "Tournaments", href: "/tournaments" },
        { label: competition?.title ?? "...", href: `/tournaments/${competitionId}` },
        { label: `Match #${matchNumber}` },
      ];

  const schema = isLeague ? matchSchema : tournamentMatchSchema;

  const handleComplete = async (rounds: Round[]) => {
    await completeMatch.mutateAsync(rounds);
  };

  const handleReopen = async () => {
    await reopenMatch.mutateAsync();
  };

  return (
    <Box>
      <AppBreadcrumbs items={breadcrumbItems} />
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <IconButton
          component={RouterLink}
          to={backUrl}
          aria-label={backLabel}
          size="small"
        >
          <ArrowBack />
        </IconButton>
        <Typography
          component={RouterLink}
          to={backUrl}
          variant="body2"
          color="text.secondary"
          sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          {backLabel}
        </Typography>
      </Box>
      {matchData.completed ? (
        <MatchDetailsView
          matchData={matchData}
          onReopen={handleReopen}
          isReopening={reopenMatch.isPending}
        />
      ) : (
        <MatchDetailsForm matchData={matchData} onComplete={handleComplete} schema={schema} />
      )}
    </Box>
  );
}
