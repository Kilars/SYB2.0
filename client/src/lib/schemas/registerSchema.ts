import { z } from "zod/v4";
import { requiredString } from "../util/util";

export const registerSchema = z.object({
    email: z.email(),
    displayName: requiredString('Display Name'),
    password: requiredString('password')
});

export type RegisterSchema = z.infer<typeof registerSchema>;