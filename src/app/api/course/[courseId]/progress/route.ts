import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

const getCourseProgressSchema = z.object({
  courseId: z.string(),
});

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = getCourseProgressSchema.parse(await params);
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });
    if (!course) {
      return new NextResponse("Course not found or you do not have permission to view it.", { status: 404 });
    }

    const totalChapters = await prisma.chapter.count({
      where: {
        unit: {
          courseId: courseId,
        },
      },
    });

    const completedChapters = await prisma.userChapterProgress.count({
      where: {
        userId: session.user.id,
        chapter: {
          unit: {
            courseId: courseId,
          },
        },
        completed: true,
      },
    });

    const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

    return NextResponse.json({ progress: progressPercentage });
  } catch (error) {
    console.error("[COURSE_PROGRESS]", error);
    return new NextResponse("An internal error occurred", { status: 500 });
  }
}
