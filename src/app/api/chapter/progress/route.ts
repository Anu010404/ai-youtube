import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { chapterProgressSchema } from "@/validators/course";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { chapterId, completed } = chapterProgressSchema.parse(body);

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    const progress = await prisma.userChapterProgress.upsert({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId,
        },
      },
      update: { completed },
      create: { userId: session.user.id, chapterId, completed },
    });

    return NextResponse.json(progress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid body", { status: 400 });
    }
    console.error("[CHAPTER_PROGRESS_POST]", error);
    return new NextResponse("An internal error occurred", { status: 500 });
  }
}
