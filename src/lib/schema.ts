import { z } from "zod";

export const wordInputSchema = z.object({
  words: z
    .string()
    .min(1, { message: "Please enter at least one word." })
    .refine((val) => val.trim().length > 0, {
      message: "Please enter at least one word.",
    }),
});
