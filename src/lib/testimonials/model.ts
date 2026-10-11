import { z } from "zod";
export const submissionSchema = z
  .object({
    comment: z.string().trim().min(20).max(1200),
    affiliation: z.string().trim().max(80).default(""),
    rating: z.number().int().min(1).max(5),
  })
  .strict();
export const reviewSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(["approved", "rejected", "pending"]),
    reviewNote: z.string().trim().max(500).default(""),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();
export type PublicTestimonial = {
  id: string;
  displayName: string;
  affiliation: string;
  comment: string;
  rating: number;
};
