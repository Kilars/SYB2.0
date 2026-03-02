import { z } from "zod/v4";
import { requiredString } from "../util/util";

export const leagueSchema = z.object({
    id: z.string().optional(),
    title: requiredString("Title"),
    description: requiredString("Description"),
    startDate: z.coerce.date({message: "Date is required"}),
    bestOf: z.number().refine(v => [1, 3, 5].includes(v), { message: "Best of must be 1, 3, or 5" }).optional(),
    members: z.object({
        id: z.string().optional(),
        userId: requiredString("User Id"),
        displayName: requiredString("Display Name"),
    }).array()
});

export type LeagueSchema = z.infer<typeof leagueSchema>;
