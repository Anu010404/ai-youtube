import { Chapter, Unit, UserChapterProgress, Quiz, UserQuizProgress } from "@prisma/client";
import React from "react";
import ChapterCompleteButton from "./ChapterCompleteButton";

type Props = {
    chapter: Chapter & {
        progress: UserChapterProgress[];
        quiz: (Quiz & {
            progress: UserQuizProgress[];
        }) | null;
    };
    unit: Unit
    unitIndex: number
    chapterIndex: number
};

const MainVideoSummary = ({chapter, unit, unitIndex, chapterIndex}: Props) => {
    const chapterIsCompleted = !!chapter.progress.length && chapter.progress[0].completed;
    // A chapter can be marked complete if its quiz is done, or if it has no quiz at all.
    const canMarkComplete = chapter.quiz ? (!!chapter.quiz.progress.length && chapter.quiz.progress[0].completed) : true;

    return (
        <div className="mt-16">
            <h4 className="text-sm uppercase text-secondary-foreground/60">Unit {unitIndex + 1} &bull; Chapter {chapterIndex + 1}</h4>
            <h1 className="text-4xl font-bold">{chapter.name}</h1>
            <iframe
            title="chapter video"
            className="w-full mt-4 aspect-video max-h-[24rem]"
            src={`https://www.youtube.com/embed/${chapter.videoId}`}
            allowFullScreen
            />
            <div className="mt-4">
                <h3 className="text-3xl font-semibold">Summary</h3>
                <p className="mt-2 text-secondary-foreground/80">{chapter.summary}</p>
                <ChapterCompleteButton 
                    chapterId={chapter.id} 
                    isCompleted={chapterIsCompleted}
                    canMarkComplete={canMarkComplete}
                />
            </div>
        </div>
    )
}

export default MainVideoSummary;