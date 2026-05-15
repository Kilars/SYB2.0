import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { FfaPlacements } from "../../app/shared/components/PodiumPickerField";
import agent from "../api/agent";

type UseFfaMatchLeagueArgs = {
  mode: "league";
  competitionId: string;
  bracketNumber: number;
  matchNumber: number;
};

type UseFfaMatchTournamentArgs = {
  mode: "tournament";
  competitionId: string;
  matchNumber: number;
};

type UseFfaMatchArgs = UseFfaMatchLeagueArgs | UseFfaMatchTournamentArgs;

type LeagueFfaPayload = FfaPlacements & {
  mode: "league";
};

// Tournament N>2 match completion: placements ride in rounds[0] matching backend RoundDto shape.
type TournamentRoundPayload = {
  competitionId: string;
  matchNumber: number;
  roundNumber: number;
  winnerUserId: string | null;
  secondPlaceUserId: string | null;
  thirdPlaceUserId: string | null;
  fourthPlaceUserId: string | null;
};

export function useFfaMatch(args: UseFfaMatchArgs) {
  const queryClient = useQueryClient();

  const { competitionId, matchNumber } = args;

  const leagueQueryKey =
    args.mode === "league"
      ? ["match", competitionId, args.bracketNumber, matchNumber]
      : null;
  const tournamentMatchQueryKey =
    args.mode === "tournament" ? ["tournamentMatch", competitionId, matchNumber] : null;
  const tournamentQueryKey =
    args.mode === "tournament" ? ["tournament", competitionId] : null;

  const completeFfaMatch = useMutation({
    mutationFn: async (placements: FfaPlacements) => {
      if (args.mode === "league") {
        const payload: LeagueFfaPayload = { ...placements, mode: "league" };
        await agent.post(
          `/matches/${competitionId}/bracket/${args.bracketNumber}/match/${matchNumber}/complete-ffa`,
          payload,
        );
      } else {
        // Tournament N>2: wrap placements as rounds[0] matching backend RoundDto extension
        const round: TournamentRoundPayload = {
          competitionId,
          matchNumber,
          roundNumber: 1,
          winnerUserId: placements.winnerUserId,
          secondPlaceUserId: placements.secondPlaceUserId,
          thirdPlaceUserId: placements.thirdPlaceUserId,
          fourthPlaceUserId: placements.fourthPlaceUserId,
        };
        await agent.post(
          `/tournaments/${competitionId}/match/${matchNumber}/complete`,
          [round],
        );
      }
    },
    onSuccess: async () => {
      if (leagueQueryKey) await queryClient.invalidateQueries({ queryKey: leagueQueryKey });
      if (tournamentMatchQueryKey)
        await queryClient.invalidateQueries({ queryKey: tournamentMatchQueryKey });
      if (tournamentQueryKey)
        await queryClient.invalidateQueries({ queryKey: tournamentQueryKey });
    },
  });

  return { completeFfaMatch };
}
