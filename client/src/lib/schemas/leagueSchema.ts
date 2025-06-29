import { z } from "zod";
import { requiredString } from "../util/util";

export const leagueSchema = z.object({
    title: requiredString("Title"),
    description: requiredString("Description"),
    startDate: z.coerce.date(),
    members: z.object({
        userId: requiredString("User Id"),
        displayName: requiredString("Display Name"),
    }).array()
});

export type LeagueSchema = z.infer<typeof leagueSchema>;
