import { z } from "zod/v4";

export const casualMatchSchema = z
  .object({
    playerOneUserId: z.string().min(1, "Player one is required"),
    playerTwoUserId: z.string().min(1, "Player two is required"),
    playerOneCharacterId: z.string().min(1, "Player one character is required"),
    playerTwoCharacterId: z.string().min(1, "Player two character is required"),
    winnerUserId: z.string().min(1, "Winner is required"),
  })
  .refine((data) => data.playerOneUserId !== data.playerTwoUserId, {
    message: "Players must be different",
    path: ["playerTwoUserId"],
  })
  .refine(
    (data) =>
      data.winnerUserId === data.playerOneUserId || data.winnerUserId === data.playerTwoUserId,
    {
      message: "Winner must be one of the players",
      path: ["winnerUserId"],
    },
  );

export type CasualMatchSchema = z.infer<typeof casualMatchSchema>;
