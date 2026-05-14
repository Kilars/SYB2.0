import { ArrowBack, SportsEsports } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useParams } from "react-router";
import { toast } from "react-toastify";
import z from "zod/v4";

import AppBreadcrumbs from "../../app/shared/components/AppBreadcrumbs";
import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import { useCompetitionMatch } from "../../lib/hooks/useCompetitionMatch";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useTournaments } from "../../lib/hooks/useTournaments";
import { matchSchema, tournamentMatchSchema } from "../../lib/schemas/matchSchema";
import { getPlayerDisplayName } from "../../lib/util/util";
import FfaMatchForm from "./FfaMatchForm";
import MatchDetailsForm from "./MatchDetailsForm";
import MatchDetailsView from "./MatchDetailsView";

interface MatchDetailsProps {
  type: "league" | "tournament";
}

type MatchFormValues = { rounds: Round[] };

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

  const isLeague = type === "league";
  const schema = isLeague ? matchSchema : tournamentMatchSchema;

  const { control, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm<MatchFormValues>({
    defaultValues: { rounds: matchData?.rounds ?? [] },
  });

  // Re-sync form state when matchData changes (navigating between matches or reopening)
  useEffect(() => {
    if (matchData) {
      reset({ rounds: matchData.rounds });
    }
  }, [matchData, reset]);

  const onSubmit = async (data: MatchFormValues) => {
    try {
      schema.parse(data.rounds);
      await completeMatch.mutateAsync(data.rounds);
      const { playerOne: p1, playerTwo: p2 } = matchData ?? {};
      if (p1 && p2) {
        const p1Score = data.rounds.filter((r) => r.winnerUserId === p1.userId).length;
        const p2Score = data.rounds.filter((r) => r.winnerUserId === p2.userId).length;
        const winner = p1Score > p2Score ? getPlayerDisplayName(p1) : getPlayerDisplayName(p2);
        toast(`${winner} wins ${Math.max(p1Score, p2Score)}–${Math.min(p1Score, p2Score)}!`, { type: "success" });
      } else {
        toast("Match completed!", { type: "success" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          toast(issue.message, { type: "error" });
        }
      } else toast("Server error", { type: "error" });
    }
  };

  const handleReopen = async () => {
    await reopenMatch.mutateAsync();
  };

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
      ) : (matchData.playerCount ?? 2) > 2 ? (
        <FfaMatchForm matchData={matchData} />
      ) : (
        <MatchDetailsForm
          matchData={matchData}
          control={control}
          handleSubmit={handleSubmit(onSubmit)}
          watch={watch}
          isSubmitting={isSubmitting}
        />
      )}
    </Box>
  );
}
