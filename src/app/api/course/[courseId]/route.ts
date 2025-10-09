import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = params;
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
    console.error("[COURSE_DELETE]", error);
    return new NextResponse("An internal error occurred", { status: 500 });
  }
}