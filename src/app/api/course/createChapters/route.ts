import { NextResponse } from "next/server";
import { createChaptersSchema } from "@/validators/course";
import { ZodError } from "zod";
import { strict_output } from "@/lib/gpt";
import { getUnsplashImage } from "@/lib/unsplash";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return new NextResponse("unauthorized", { status: 401 });
        }

        const body = await request.json();
        const {title,units} = createChaptersSchema.parse(body);
        
        type outputUnits ={
            title: string;
            chapters:{
                youtube_search_query: string;
                chapter_title: string;
            }[];
        }[];

        let output_units: outputUnits = await strict_output(
            'You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter',
            units.map((unit) => {
                return `It is your job to create a course about ${title}. The user has requested to create chapters for the unit: "${unit}". For each chapter, provide a detailed youtube search query that can be used to find an informative educational video.`;
            }),
            {
                title: 'title of the unit',
                chapters: 'an array of chapters, each chapter should have a youtube_search_query and a chapter_title key in the JSON object',
            }
        );

        const imageSearchTerm = await strict_output(
            'You are an AI capable of finding the most relevant image for a course',
            `Please provide a good image search term for the title of a course about ${title}. This search term will be fed into the Unsplash API, so make sure it is a good search term that will return good results.`,
            {
                image_search_term: 'a good search term for the course title',
            }
        );
    const course_image = await getUnsplashImage(imageSearchTerm.image_search_term);

    const course = await prisma.course.create({
        data: {
            name: title,
            image: course_image,
            userId: session.user.id,
        },
    });

    for (const unit of output_units) {
        const unitTitle = unit.title;
        const prismaUnit = await prisma.unit.create({
            data:{
                name: unitTitle,
                courseId: course.id,
            }
        })
        await prisma.chapter.createMany({
            data: unit.chapters.map((chapter) => {
                return {
                    name: chapter.chapter_title,
                    youtubeSearchQuery: chapter.youtube_search_query,
                    unitId: prismaUnit.id,
                };
            }),
        });
    }

        return NextResponse.json({ course_id: course.id });
    } catch (error) {
        if (error instanceof ZodError) {
            return new NextResponse('invalid body', { status: 400 });
        }
        console.error("--- /api/course/createChapters error ---", error);
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse("An internal error occurred", { status: 500 });
    }
}