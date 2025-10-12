import * as z from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(100),
  description: z.string().min(10, "Description must be at least 10 characters long").max(500),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  units: z.array(z.string()).min(1, "At least one unit is required."),
});

export const chapterProgressSchema = z.object({
  chapterId: z.string(),
  completed: z.boolean(),
});

export type CreateCourseSchema = z.infer<typeof createCourseSchema>;