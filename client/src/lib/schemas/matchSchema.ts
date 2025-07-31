import { z } from "zod/v4";

type PlayerRoundInput = {
  playerOneCharacterId: string;
  playerTwoCharacterId: string;
  winnerUserId: string;
}

const roundInputSchema = z.object({
  playerOneCharacterId: z.string().optional(),
  playerTwoCharacterId: z.string().optional(),
  winnerUserId: z.string().optional(),
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
    (round): round is PlayerRoundInput =>
      !!round.playerOneCharacterId && !!round.playerTwoCharacterId && !!round.winnerUserId
  );

  const winCountDict = playedRounds.reduce<Record<string, number>>((acc, round) => {
    acc[round.winnerUserId] = (acc[round.winnerUserId] || 0) + 1;
    return acc;
  }, {});
  const winCounts = Object.values(winCountDict);
  const winDiff = Math.abs(winCounts?.[0] || 0 - winCounts?.[1] || 0);
  const roundsRemaining = rounds.length - playedRounds.length;

  if (winDiff === 0) {
    ctx.addIssue({
      code: "custom",
      message: "This is not a decisive result",
      input: rounds
    })
  }

  if (winDiff < roundsRemaining) {
    ctx.addIssue({
      code: "custom",
      message: "Not enough matches played",
      input: rounds
    })
  }

  const incompleteRoundIndex = rounds.findIndex(round => !!round.playerOneCharacterId
    === !!round.playerTwoCharacterId
    === !!round.winnerUserId)
  if (incompleteRoundIndex > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Incomplete round registration",
      input: incompleteRoundIndex
    })
  }
});

export type MatchSchema = z.infer<typeof matchSchema>;