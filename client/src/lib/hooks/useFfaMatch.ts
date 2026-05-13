import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { FfaPlacements } from "../../app/shared/components/PodiumPickerField";
import agent from "../api/agent";

type UseFfaMatchArgs = {
  competitionId: string;
  bracketNumber: number;
  matchNumber: number;
};

type FfaMatchPayload = FfaPlacements & {
  mode: "league";
};

export function useFfaMatch({
  competitionId,
  bracketNumber,
  matchNumber,
}: UseFfaMatchArgs) {
  const queryClient = useQueryClient();

  const queryKey = ["match", competitionId, bracketNumber, matchNumber];

  const completeFfaMatch = useMutation({
    mutationFn: async (placements: FfaPlacements) => {
      const payload: FfaMatchPayload = {
        ...placements,
        mode: "league",
      };
      await agent.post(
        `/matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}/complete-ffa`,
        payload,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return { completeFfaMatch };
}
