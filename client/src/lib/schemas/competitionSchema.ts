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
  playerCount: z
    .literal(2)
    .or(z.literal(3))
    .or(z.literal(4))
    .nullable()
    .optional()
    .transform((v) => v ?? 2),
});

export const tournamentSchema = baseCompetitionSchema;

export type LeagueSchema = z.infer<typeof leagueSchema>;
export type TournamentSchema = z.infer<typeof tournamentSchema>;
