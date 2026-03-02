import { z } from "zod/v4";

type PlayerRoundInput = {
  playerOneCharacterId: string;
  playerTwoCharacterId: string;
  winnerUserId: string;
};

const roundInputSchema = z.object({
  playerOneCharacterId: z.string().nullable().optional(),
  playerTwoCharacterId: z.string().nullable().optional(),
  winnerUserId: z.string().nullable().optional(),
});

export const matchSchema = z.array(roundInputSchema).superRefine((rounds, ctx) => {
  if (!Array.isArray(rounds)) {
    ctx.addIssue({
      code: "custom",
      message: "Not enough matches played",
      input: rounds,
    });
    return;
  }
  const playedRounds: PlayerRoundInput[] = rounds.filter(
    (round): round is PlayerRoundInput =>
      !!round.playerOneCharacterId && !!round.playerTwoCharacterId && !!round.winnerUserId,
  );
  const winCountDict = playedRounds.reduce<Record<string, number>>((acc, round) => {
    acc[round.winnerUserId] = (acc[round.winnerUserId] || 0) + 1;
    return acc;
  }, {});
  const winCounts = Object.values(winCountDict);
  const winDiff = Math.abs((winCounts?.[0] || 0) - (winCounts?.[1] || 0));
  const roundsRemaining = rounds.length - playedRounds.length;

  const incompleteRoundIndex = rounds.findIndex((round) => {
    const values = Object.values(round);
    const filled = values.filter((v) => !!v).length;
    return filled > 0 && filled < values.length;
  });
  if (incompleteRoundIndex > -1) {
    ctx.addIssue({
      code: "custom",
      message: `Incomplete round registration: 'Round ${incompleteRoundIndex + 1}'`,
      input: incompleteRoundIndex,
      path: [incompleteRoundIndex],
    });
  } else if (roundsRemaining < Math.round(rounds.length / 2) && winDiff === 0) {
    ctx.addIssue({
      code: "custom",
      message: "This is a tried result",
      input: rounds,
    });
  } else if (winDiff < roundsRemaining) {
    ctx.addIssue({
      code: "custom",
      message: "Not enough matches played",
      input: rounds,
    });
  }
});

export type MatchSchema = z.infer<typeof matchSchema>;

export const tournamentMatchSchema = z
  .array(
    z.object({
      competitionId: z.string(),
      bracketNumber: z.number(),
      matchNumber: z.number(),
      roundNumber: z.number(),
      completed: z.boolean().optional(),
      winnerUserId: z.string().nullable().optional(),
      playerOneCharacterId: z.string().nullable().optional(),
      playerTwoCharacterId: z.string().nullable().optional(),
    }),
  )
  .refine(
    (rounds) => {
      const roundsWithWinner = rounds.filter((r) => r.winnerUserId);
      if (roundsWithWinner.length === 0) return false;
      const winCounts = roundsWithWinner.reduce<Record<string, number>>((acc, r) => {
        const winner = r.winnerUserId as string;
        acc[winner] = (acc[winner] || 0) + 1;
        return acc;
      }, {});
      const requiredWins = Math.ceil(rounds.length / 2);
      return Object.values(winCounts).some((c) => c >= requiredWins);
    },
    { message: "A player must win the majority of rounds" },
  );
