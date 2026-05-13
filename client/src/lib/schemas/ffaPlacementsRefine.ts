import { z } from "zod/v4";

/**
 * FFA placements flat schema shape.
 * Empty string `""` is treated as unset (same as null).
 */
export const ffaPlacementsBaseSchema = z.object({
  winnerUserId: z.string().nullable().optional(),
  secondPlaceUserId: z.string().nullable().optional(),
  thirdPlaceUserId: z.string().nullable().optional(),
  fourthPlaceUserId: z.string().nullable().optional(),
});

export type FfaPlacementsBase = z.infer<typeof ffaPlacementsBaseSchema>;

/**
 * Normalize a placement field value: treat empty string as null.
 */
function normalize(v: string | null | undefined): string | null {
  if (v == null || v === "") return null;
  return v;
}

/**
 * Factory that produces a Zod schema with placement validation rules.
 *
 * @param participantsRef - Called fresh on each superRefine invocation to avoid stale-closure bugs.
 *   When participants change after schema creation, the new list is always used for validation.
 * @param opts.allowWinnerOnly - If true, having only the winner set is valid.
 * @param opts.requireFullPodium - If true, all placements up to the active player count must be set.
 *
 * Rules enforced:
 * (a) All set placements are in participantsRef().
 * (b) No duplicate userIds across placement slots.
 * (c) No holes in the podium: if thirdPlaceUserId is set then secondPlaceUserId must be set, etc.
 * (d) Winner-only mode: if allowWinnerOnly && !requireFullPodium, non-winner placements may be null.
 * (e) Empty string `""` is treated as unset.
 */
export function makeFfaResultSchema(
  participantsRef: () => string[],
  opts: { allowWinnerOnly: boolean; requireFullPodium: boolean },
) {
  return ffaPlacementsBaseSchema.superRefine((data, ctx) => {
    const participants = participantsRef(); // Always fresh — no stale closure

    const winner = normalize(data.winnerUserId);
    const second = normalize(data.secondPlaceUserId);
    const third = normalize(data.thirdPlaceUserId);
    const fourth = normalize(data.fourthPlaceUserId);

    const placements = [winner, second, third, fourth];
    const setPlacements = placements.filter((p): p is string => p !== null);

    // (a) All set placements must be in the participant list
    const participantSet = new Set(participants);
    for (const [field, value] of [
      ["winnerUserId", winner],
      ["secondPlaceUserId", second],
      ["thirdPlaceUserId", third],
      ["fourthPlaceUserId", fourth],
    ] as const) {
      if (value !== null && !participantSet.has(value)) {
        ctx.addIssue({
          code: "custom",
          message: `Placed player is not in the participant list`,
          path: [field],
          input: value,
        });
      }
    }

    // (b) No duplicate userIds across placement slots
    const seen = new Set<string>();
    for (const [field, value] of [
      ["winnerUserId", winner],
      ["secondPlaceUserId", second],
      ["thirdPlaceUserId", third],
      ["fourthPlaceUserId", fourth],
    ] as const) {
      if (value !== null) {
        if (seen.has(value)) {
          ctx.addIssue({
            code: "custom",
            message: "Duplicate player in placements",
            path: [field],
            input: value,
          });
        } else {
          seen.add(value);
        }
      }
    }

    // (c) No holes in the podium
    if (fourth !== null && third === null) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot set 4th place without 3rd place",
        path: ["fourthPlaceUserId"],
        input: fourth,
      });
    }
    if (third !== null && second === null) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot set 3rd place without 2nd place",
        path: ["thirdPlaceUserId"],
        input: third,
      });
    }
    if (second !== null && winner === null) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot set 2nd place without a winner",
        path: ["secondPlaceUserId"],
        input: second,
      });
    }

    // (d) Winner must be set if any placements exist
    if (setPlacements.length > 0 && winner === null) {
      ctx.addIssue({
        code: "custom",
        message: "Winner must be set",
        path: ["winnerUserId"],
        input: winner,
      });
    }

    // (e) requireFullPodium: all non-null-participant slots must be filled
    if (opts.requireFullPodium && participants.length > 0) {
      const requiredCount = Math.min(participants.length, 4);
      if (setPlacements.length < requiredCount) {
        ctx.addIssue({
          code: "custom",
          message: `All ${requiredCount} positions must be filled`,
          path: ["winnerUserId"],
          input: data,
        });
      }
    }

    // (d) allowWinnerOnly: if only winner is set, that's fine — no additional error
    // (already handled by absence of no-holes violations above)
  });
}
