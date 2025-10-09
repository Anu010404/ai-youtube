import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ZodError } from "zod";
import { getAuthSession } from "@/lib/auth";

const deleteCourseSchema = z.object({
  courseId: z.string(),
});

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = deleteCourseSchema.parse(params);
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: session.user.id, // Ensure the user owns the course
      },
    });
    if (!course) {
      return new NextResponse("Course not found or you do not have permission to delete it.", { status: 404 });
    }
    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      return new NextResponse("Invalid courseId", { status: 400 });
    }
    console.error("[COURSE_DELETE]", error);
    return new NextResponse("An internal error occurred", { status: 500 });
  }
}