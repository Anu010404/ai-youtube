import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  getQuestionsFromTranscript,
  getTranscript,
  searchYouTube,
} from "@/lib/youtube";
import { strict_output } from "@/lib/gpt";

const bodyParser=z.object({
    chapterId: z.string(),
});



export async function POST(req: Request, res: Response) {
    try{
        const body = await req.json();
        const {chapterId} = bodyParser.parse(body);
        const chapter = await prisma.chapter.findUnique({
            where: {
                id: chapterId,
            },
        });
        if (!chapter) {
            return NextResponse.json({
                success: false,
                error: "Chapter not found",
            }, {
                status: 404,
            })
        }
        const videoId = await searchYouTube(chapter.youtubeSearchQuery);
        if (!videoId) {
            return NextResponse.json({
                success: false,
                error: "YouTube video not found",
            }, {
                status: 404,
            });
        }
        let transcript = await getTranscript(videoId);
        let maxLength=250
        transcript=transcript.split(' ').slice(0,maxLength).join(' ');
        const {summary}: {summary:string} = await strict_output('You are an AI capable of summarizing a youtube transcript',
            'summarize in 250 words or less and donot talk of the sponsers or anything unrelate to the main topic, also do not introduce what the summary is about. \n'+transcript,
            {
                summary: 'summary of the transcript',
            
            }
        );

        const questions = await getQuestionsFromTranscript(transcript, chapter.name);

        await prisma.question.createMany({
            data: questions.map((question) => {
                const options = [question.answer, question.option1, question.option2, question.option3, question.option4].sort(() => Math.random() - 0.5);
                return {
                    question: question.question,
                    answer: question.answer,
                    options: options,
                    chapterId: chapterId,
                };
            }),
        });
        await prisma.chapter.update({
            where: {
                id: chapterId,
            },
            data: {
                videoId: videoId,
                summary: summary,
            },
        });

        return NextResponse.json({
            success: true
        });
    }catch(error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: "Invalid request body",
            }, {
                status: 400,
            })
        }
        else{
            return NextResponse.json({
                success: false,
                error: "Something went wrong",
            }, {
                status: 500,
            })
        }
    }
}
