import { z } from "zod";

export const createChaptersSchema = z.object({
  title: z.string().min(3).max(100),
  units: z.array(z.string()),
});

export const chapterProgressSchema = z.object({
  chapterId: z.string(),
  isCompleted: z.boolean(),
});