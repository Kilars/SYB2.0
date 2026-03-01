import { z } from "zod/v4";
import { requiredString } from "../util/util";

export const tournamentSchema = z.object({
    id: z.string().optional(),
    title: requiredString("Title"),
    description: requiredString("Description"),
    startDate: z.coerce.date({ message: "Date is required" }),
    bestOf: z.number().refine(v => [1, 3, 5].includes(v), { message: "Best of must be 1, 3, or 5" }),
    members: z.object({
        userId: requiredString("User Id"),
        displayName: requiredString("Display Name"),
    }).array(),
});

export type TournamentSchema = z.infer<typeof tournamentSchema>;

export const tournamentMatchSchema = z.array(
    z.object({
        tournamentId: z.string(),
        matchNumber: z.number(),
        roundNumber: z.number(),
        completed: z.boolean().optional(),
        winnerUserId: z.string().optional(),
        playerOneCharacterId: z.string().optional(),
        playerTwoCharacterId: z.string().optional(),
    })
).refine(
    rounds => {
        const roundsWithWinner = rounds.filter(r => r.winnerUserId);
        if (roundsWithWinner.length === 0) return false;
        const winCounts = roundsWithWinner.reduce((acc, r) => {
            acc[r.winnerUserId!] = (acc[r.winnerUserId!] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const requiredWins = Math.ceil(rounds.length / 2);
        return Object.values(winCounts).some(c => c >= requiredWins);
    },
    { message: "A player must win the majority of rounds" }
);
