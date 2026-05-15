import { z } from "zod/v4";

import { requiredString } from "../util/util";

const baseMember = z.object({
  userId: requiredString("User Id"),
  displayName: requiredString("Display Name"),
});

const baseCompetitionSchema = z.object({
  id: z.string().optional(),
  title: requiredString("Title"),
  description: requiredString("Description"),
  startDate: z.coerce.date({ message: "Date is required" }),
  bestOf: z
    .number()
    .refine((v) => [1, 3, 5].includes(v), { message: "Best of must be 1, 3, or 5" }),
  members: baseMember.array(),
});

export const leagueSchema = baseCompetitionSchema.extend({
  bestOf: baseCompetitionSchema.shape.bestOf.optional(),
  members: baseMember.extend({ id: z.string().optional() }).array(),
});

export const tournamentSchema = baseCompetitionSchema
  .extend({
    perHeatPlayerCount: z
      .number()
      .refine((v) => [2, 3, 4].includes(v), { message: "Per-heat player count must be 2, 3, or 4" })
      .default(2),
  })
  .superRefine((data, ctx) => {
    if (data.perHeatPlayerCount > 2 && data.bestOf !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Best of must be 1 when per-heat player count is greater than 2",
        path: ["bestOf"],
        input: data.bestOf,
      });
    }
  });

export type LeagueSchema = z.infer<typeof leagueSchema>;
export type TournamentSchema = z.infer<typeof tournamentSchema>;
