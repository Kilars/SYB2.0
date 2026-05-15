import { z } from "zod/v4";

import { makeFfaResultSchema } from "./ffaPlacementsRefine";

// N=2 sub-schema: characters required, no FFA fields
const twoPlayerSchema = z
  .object({
    playerCount: z.literal(2),
    playerOneUserId: z.string().min(1, "Player one is required"),
    playerTwoUserId: z.string().min(1, "Player two is required"),
    playerThreeUserId: z.string().optional(),
    playerFourUserId: z.string().optional(),
    playerOneCharacterId: z.string().min(1, "Player one character is required"),
    playerTwoCharacterId: z.string().min(1, "Player two character is required"),
    playerThreeCharacterId: z.string().optional(),
    playerFourCharacterId: z.string().optional(),
    winnerUserId: z.string().min(1, "Winner is required"),
    secondPlaceUserId: z.string().nullable().optional(),
    thirdPlaceUserId: z.string().nullable().optional(),
    fourthPlaceUserId: z.string().nullable().optional(),
  })
  .refine((data) => data.playerOneUserId !== data.playerTwoUserId, {
    message: "Players must be different",
    path: ["playerTwoUserId"],
  })
  .refine(
    (data) =>
      data.winnerUserId === data.playerOneUserId ||
      data.winnerUserId === data.playerTwoUserId,
    {
      message: "Winner must be one of the players",
      path: ["winnerUserId"],
    },
  );

// N=3 sub-schema: playerThree required, characters optional, FFA placements
const threePlayerBaseSchema = z.object({
  playerCount: z.literal(3),
  playerOneUserId: z.string().min(1, "Player one is required"),
  playerTwoUserId: z.string().min(1, "Player two is required"),
  playerThreeUserId: z.string().min(1, "Player three is required"),
  playerFourUserId: z.string().optional(),
  playerOneCharacterId: z.string().optional(),
  playerTwoCharacterId: z.string().optional(),
  playerThreeCharacterId: z.string().optional(),
  playerFourCharacterId: z.string().optional(),
  winnerUserId: z.string().min(1, "Winner is required"),
  secondPlaceUserId: z.string().nullable().optional(),
  thirdPlaceUserId: z.string().nullable().optional(),
  fourthPlaceUserId: z.string().nullable().optional(),
});

// N=4 sub-schema: playerThree + playerFour required, characters optional, FFA placements
const fourPlayerBaseSchema = z.object({
  playerCount: z.literal(4),
  playerOneUserId: z.string().min(1, "Player one is required"),
  playerTwoUserId: z.string().min(1, "Player two is required"),
  playerThreeUserId: z.string().min(1, "Player three is required"),
  playerFourUserId: z.string().min(1, "Player four is required"),
  playerOneCharacterId: z.string().optional(),
  playerTwoCharacterId: z.string().optional(),
  playerThreeCharacterId: z.string().optional(),
  playerFourCharacterId: z.string().optional(),
  winnerUserId: z.string().min(1, "Winner is required"),
  secondPlaceUserId: z.string().nullable().optional(),
  thirdPlaceUserId: z.string().nullable().optional(),
  fourthPlaceUserId: z.string().nullable().optional(),
});

/**
 * Build an N>2 schema with FFA placement validation.
 * participantsRef is called fresh on each superRefine — no stale-closure bug.
 */
function makeNPlayerSchema<T extends typeof threePlayerBaseSchema | typeof fourPlayerBaseSchema>(
  base: T,
  participantsRef: () => string[],
) {
  const placementsSchema = makeFfaResultSchema(participantsRef, {
    allowWinnerOnly: true,
    requireFullPodium: false,
  });

  return base.superRefine((data, ctx) => {
    // Participants must be distinct
    const ids = [
      data.playerOneUserId,
      data.playerTwoUserId,
      data.playerThreeUserId,
      "playerFourUserId" in data ? data.playerFourUserId : undefined,
    ].filter((id): id is string => !!id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "All player IDs must be distinct",
        path: ["playerTwoUserId"],
        input: data,
      });
    }

    // Delegate placement validation to FFA schema
    const placementsData = {
      winnerUserId: data.winnerUserId || null,
      secondPlaceUserId: data.secondPlaceUserId ?? null,
      thirdPlaceUserId: data.thirdPlaceUserId ?? null,
      fourthPlaceUserId: data.fourthPlaceUserId ?? null,
    };
    const result = placementsSchema.safeParse(placementsData);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: issue.path,
          input: placementsData,
        });
      }
    }
  });
}

/**
 * Build a fully-validated casual match schema for a given participant list.
 * Call this in useMemo in the form, keyed on participant IDs.
 * N=2 path uses static twoPlayerSchema; N>2 path injects a live participantsRef.
 */
export function makeCasualMatchSchema(participantsRef: () => string[], playerCount: 2 | 3 | 4) {
  if (playerCount === 2) return twoPlayerSchema;
  if (playerCount === 3) return makeNPlayerSchema(threePlayerBaseSchema, participantsRef);
  return makeNPlayerSchema(fourPlayerBaseSchema, participantsRef);
}
