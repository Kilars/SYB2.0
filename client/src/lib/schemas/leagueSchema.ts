import { z } from "zod";
import { requiredString } from "../util/util";

export const leagueSchema = z.object({
    id: z.string().optional(),
    title: requiredString("Title"),
    description: requiredString("Description"),
    startDate: z.coerce.date({message: "Date is required"}),
    members: z.object({
        id: z.string().optional(),
        userId: requiredString("User Id"),
        displayName: requiredString("Display Name"),
    }).array()
});

export type LeagueSchema = z.infer<typeof leagueSchema>;
