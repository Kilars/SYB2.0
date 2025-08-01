import { z } from "zod/v4";

type PlayerRoundInput = {
  playerOneCharacterId: string;
  playerTwoCharacterId: string;
  winnerUserId: string;
}

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
      input: rounds
    });
    return;
  }
  const playedRounds: PlayerRoundInput[] = rounds.filter(
    (round): round is PlayerRoundInput => !!round.playerOneCharacterId && !!round.playerTwoCharacterId && !!round.winnerUserId
  );
  const winCountDict = playedRounds.reduce<Record<string, number>>((acc, round) => {
    acc[round.winnerUserId] = (acc[round.winnerUserId] || 0) + 1;
    return acc;
  }, {});
  const winCounts = Object.values(winCountDict);
  const winDiff = Math.abs((winCounts?.[0] || 0) - (winCounts?.[1] || 0));
  console.log(winCountDict);

  console.log("windiff", winDiff);

  const roundsRemaining = rounds.length - playedRounds.length;

  const incompleteRoundIndex = rounds.findIndex(round => {
    const values = Object.values(round);
    const filled = values.filter(v => !!v).length;
    return filled > 0 && filled < values.length;;
  })
  if (incompleteRoundIndex > -1) {
    ctx.addIssue({
      code: "custom",
      message: `Incomplete round registration: 'Round ${incompleteRoundIndex + 1}'`,
      input: incompleteRoundIndex,
      path: [incompleteRoundIndex]
    })
  } else if (roundsRemaining < Math.round(rounds.length / 2) && winDiff === 0) {
    ctx.addIssue({
      code: "custom",
      message: "This is a tried result",
      input: rounds
    })
  } else if (winDiff < roundsRemaining) {
    ctx.addIssue({
      code: "custom",
      message: "Not enough matches played",
      input: rounds
    })
  }

});

export type MatchSchema = z.infer<typeof matchSchema>;