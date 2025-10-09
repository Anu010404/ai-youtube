import { NextResponse } from "next/server";
import { createChaptersSchema } from "@/validators/course";
import { ZodError } from "zod";
import { strict_output } from "@/lib/gpt";
import { getUnsplashImage } from "@/lib/unsplash";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import {
  getRankedVideos,
  getTranscript,
  generateQuizQuestions,
} from "@/lib/youtube";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("unauthorized", { status: 401 });
    }
    const body = await req.json();
    const { title, units } = createChaptersSchema.parse(body);

    type outputUnit = {
      title: string;
      chapters: {
        youtube_search_query: string;
        chapter_title: string;
      }[];
    };

    let output_units: outputUnit[] = await strict_output(
      "You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter",
      units.map((unit) => {
        return `It is your job to create a course about ${title}. The user has requested to create chapters for the unit: "${unit}". For each chapter, provide a detailed youtube search query that can be used to find an informative educational video.`;
      }),
      {
        title: "title of the unit",
        chapters:
          "an array of chapters, each chapter should have a youtube_search_query and a chapter_title key in the JSON object",
      }
    );

    const imageSearchTerm = await strict_output(
      "You are an AI capable of finding the most relevant image for a course",
      `Please provide a good image search term for the title of a course about ${title}. This search term will be fed into the Unsplash API, so make sure it is a single word or a short, concise phrase (e.g., "JavaScript" or "Data Science") for the best results.`,
      {
        image_search_term: "a good search term for the course title",
      }
    );

    const course_image = await getUnsplashImage(
      imageSearchTerm.image_search_term
    );

    const course = await prisma.course.create({
      data: {
        name: title,
        image: course_image,
        userId: session.user.id,
      },
    });

    let allChapterContexts: string[] = [];
    let lastUnitId: string | null = null;

    for (const [index, unit] of output_units.entries()) {
      try {
        const unitTitle = unit.title;
        console.log(`\n--- Processing Unit ${index + 1}/${output_units.length}: ${unitTitle} ---`);
        const unitChapterContexts: string[] = [];

        const prismaUnit = await prisma.unit.create({
          data: {
            name: unitTitle,
            courseId: course.id,
          },
        });
        lastUnitId = prismaUnit.id;

        for (const chapter of unit.chapters) {
          console.log(`--- Processing Chapter: ${chapter.chapter_title} ---`);
          const rankedVideos = await getRankedVideos(
            chapter.youtube_search_query
          );
          if (!rankedVideos || rankedVideos.length === 0) {
            console.warn(`No videos found for query: "${chapter.youtube_search_query}". Skipping chapter.`);
            continue;
          }
          const bestVideo = rankedVideos[0];
          const transcript = await getTranscript(bestVideo.id);
          const contextForContent = transcript || `${chapter.chapter_title}. ${bestVideo.description}`;

          let summary: string | null = null;
          let questions: any[] = [];

          if (contextForContent.trim().length > 50) {
            console.log(`Generating summary & questions for: "${chapter.chapter_title}"`);
            [summary, questions] = await Promise.all([
              Promise.resolve(null), // generateSummary removed
              generateQuizQuestions(contextForContent, 3),
            ]);
          }

          const chapterContext = summary || contextForContent;
          allChapterContexts.push(chapterContext);
          unitChapterContexts.push(chapterContext);

          const prismaChapter = await prisma.chapter.create({
            data: {
              name: chapter.chapter_title,
              youtubeSearchQuery: chapter.youtube_search_query,
              unitId: prismaUnit.id,
              videoId: bestVideo.id,
              summary: summary,
            },
          });

          if (questions.length > 0) {
            console.log(`Creating quiz for chapter: "${chapter.chapter_title}"`);
            const quiz = await prisma.quiz.create({
              data: {
                name: `Quiz for: ${chapter.chapter_title}`,
                type: "CHAPTER",
                unitId: prismaUnit.id,
                chapterId: prismaChapter.id,
              },
            });
            await prisma.question.createMany({
              data: questions.map((q) => ({
                question: q.question,
                answer: q.answer,
                options: q.options,
                quizId: quiz.id,
              })),
            });
          }
        }

        if (unitChapterContexts.length > 0) {
          const unitTestContext = unitChapterContexts.join("\n\n---\n\n");
          const unitTestName = `Unit Test: ${unitTitle}`;
          console.log(`Generating unit test: "${unitTestName}"`);
          const unitTestQuestions = await generateQuizQuestions(unitTestContext, 5);
          if (unitTestQuestions.length > 0) {
            const quiz = await prisma.quiz.create({
              data: {
                name: unitTestName,
                type: "UNIT_TEST",
                unitId: prismaUnit.id,
              },
            });
            await prisma.question.createMany({
              data: unitTestQuestions.map((q) => ({
                question: q.question,
                answer: q.answer,
                options: q.options,
                quizId: quiz.id,
              })),
            });
            console.log(`Successfully created unit test for: "${unitTitle}"`);
          }
        }
      } catch (unitError) {
        console.error(`\n---! FAILED TO PROCESS UNIT: ${unit.title} !---`, unitError);
      }
    }

    return NextResponse.json({ course_id: course.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return new NextResponse("invalid body", { status: 400 });
    }
    console.error("--- /api/course/createChapters error ---", error);
    return new NextResponse("An internal error occurred", { status: 500 });
  }
}