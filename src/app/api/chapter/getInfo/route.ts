import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTranscript, searchYouTube } from "@/lib/youtube";
import { strict_output } from "@/lib/gpt";
import { getAuthSession } from "@/lib/auth";

const getInfoSchema = z.object({
  chapterId: z.string(),
});

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("unauthorized", { status: 401 });
    }
    const body = await req.json();
    const { chapterId } = getInfoSchema.parse(body);

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      include: {
        unit: true,
      },
    });

    if (!chapter) {
      return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
    }

    // Get all videoIds already used in this course to ensure uniqueness
    const usedVideoIdsResult = await prisma.chapter.findMany({
      where: {
        unit: {
          courseId: chapter.unit.courseId,
        },
        videoId: {
          not: null,
        },
      },
      select: {
        videoId: true,
      },
    });
    const usedVideoIds = new Set(
      usedVideoIdsResult.map((c) => c.videoId).filter((v): v is string => !!v)
    );

    let videoIds = await searchYouTube(chapter.youtubeSearchQuery);
    if (!videoIds || videoIds.length === 0) {
      // Fallback to chapter name if search query fails
      videoIds = await searchYouTube(chapter.name);
      if (!videoIds || videoIds.length === 0) {
        return NextResponse.json({ success: false, error: "Could not find videos for chapter" }, { status: 404 });
      }
    }

    let videoId: string | null = null;
    let transcript: string | null = null;

    // Filter out already used videos
    const availableVideoIds = videoIds.filter((id) => !usedVideoIds.has(id));
    if (availableVideoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not find a unique video for this chapter. All found videos are already in use." },
        { status: 404 }
      );
    }

    // Find the first video with a transcript from the available ones
    for (const id of availableVideoIds) {
      try {
        const tempTranscript = await getTranscript(id);
        if (tempTranscript && tempTranscript.length > 0) {
          videoId = id;
          transcript = tempTranscript;
          break;
        }
      } catch (error) {
        console.error(`Error fetching transcript for video ${id}:`, error);
      }
    }

    // If no video with transcript is found, use the first available video as a fallback
    if (!videoId) {
      videoId = availableVideoIds[0];
    }

    if (!videoId) {
      // This case should be rare now, but as a safeguard.
      return NextResponse.json({ success: false, error: "Could not find any suitable video for this chapter." }, { status: 404 });
    }

    // If we have a transcript, generate summary and questions
    if (transcript) {
      // Use a smaller portion of the transcript to generate summary and questions to save on tokens
      const transcript_words = transcript.split(" ");
      if (transcript_words.length > 500) {
          transcript = transcript_words.slice(0, 500).join(" ");
      }

      const chapterInfo: {
        summary: string;
        questions: { question: string; answer: string; option1: string; option2: string; option3: string; };
      } = await strict_output(
        'You are an AI capable of summarising a youtube transcript and creating a single multiple choice question based on it.',
        'You are to give a summary of the transcript and create a single multiple choice question with 4 options (1 correct answer, 3 incorrect options). Do not talk of the sponsors or anything unrelated to the main topic. The summary should be in 250 words or less. Each quiz answer/option should not be more than 15 words. \n\nTranscript:\n' + transcript,
        {
          summary: 'summary of the transcript',
          questions: {
            question: "question",
            answer: "answer with maximum of 15 words",
            option1: "option1 with maximum of 15 words",
            option2: "option2 with maximum of 15 words",
            option3: "option3 with maximum of 15 words",
          }
        }
      );

      const { summary, questions } = chapterInfo;

      await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          videoId: videoId,
          summary: summary,
        },
      });

      const options = [questions.answer, questions.option1, questions.option2, questions.option3].sort(() => Math.random() - 0.5);

      await prisma.question.create({
        data: { question: questions.question, answer: questions.answer, options, chapterId: chapterId },
      });
    } else {
      // No transcript, just update videoId
      await prisma.chapter.update({
          where: { id: chapterId },
          data: {
            videoId: videoId,
          },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHAPTER_GETINFO]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "An internal error occurred" }, { status: 500 });
  }
}