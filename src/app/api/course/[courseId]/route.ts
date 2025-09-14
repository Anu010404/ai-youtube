import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";

const deleteCourseSchema = z.object({
  courseId: z.string(),
});

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  return NextResponse.json({
    message: `GET request received for courseId: ${params.courseId}`,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = deleteCourseSchema.parse({ ...params });
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("unauthorized", { status: 401 });
    }
    console.log(`--- Attempting to delete course: ${courseId} ---`);

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
    });

    if (!course || course.userId !== session.user.id) {
      return new NextResponse("forbidden or not found", { status: 403 });
    }

    // To ensure all related data is deleted, we'll perform a cascading
    // delete manually within a transaction. This is more robust than
    // relying on `onDelete: Cascade` which might not be set in the schema.
    await prisma.$transaction(async (tx) => {
      // Delete all questions related to the course's chapters
      await tx.question.deleteMany({
        where: {
          chapter: {
            unit: {
              courseId: courseId,
            },
          },
        },
      });

      // Delete all chapters related to the course's units
      await tx.chapter.deleteMany({
        where: { unit: { courseId: courseId } },
      });

      // Delete all units related to the course
      await tx.unit.deleteMany({ where: { courseId: courseId } });

      // Finally, delete the course itself
      await tx.course.delete({ where: { id: courseId } });
    });

    return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[COURSE_DELETE]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("invalid courseId", { status: 400 });
    }
    return new NextResponse("An internal error occurred", { status: 500 });
  }
}
