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
  unit: Unit;
  unitIndex: number;
  chapterIndex: number;
};

const MainVideoSummary = ({ chapter, unit, unitIndex, chapterIndex }: Props) => {
  return (
    <div className="mt-16 w-full flex flex-col items-center pb-20">
      {/* Header */}
      <div className="text-center mb-10 px-6 max-w-6xl">
        <h4 className="text-sm uppercase text-purple-600 dark:text-purple-300 mb-2 tracking-widest">
          Unit {unitIndex + 1} • Chapter {chapterIndex + 1}
        </h4>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white drop-shadow-md">
          {chapter.name}
        </h1>
      </div>

      {/* YouTube Video */}
      <div className="w-full flex justify-center">
        <div
          className="group w-[90%] md:w-[80%] rounded-2xl overflow-hidden 
          border border-purple-400/30 bg-white/5 dark:bg-gray-900/50 
          backdrop-blur-md shadow-lg transition-all duration-300 
          hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
        >
          <div className="aspect-[16/8] relative">
            <iframe
              title="chapter video"
              src={`https://www.youtube.com/embed/${chapter.videoId}`}
              className="absolute top-0 left-0 w-full h-full rounded-2xl"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="w-full mt-12 flex justify-center">
        <div
          className="group w-[90%] md:w-[80%] rounded-2xl 
          border border-purple-400/30 bg-white/10 dark:bg-gray-900/50 
          backdrop-blur-lg shadow-lg p-8 transition-all duration-300 
          hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
        >
          <h3 className="text-3xl font-semibold text-purple-700 dark:text-purple-300 mb-4 text-center">
            Summary
          </h3>

          <p
            className="text-gray-700 dark:text-gray-300 leading-relaxed text-justify text-lg 
            bg-white/40 dark:bg-gray-800/40 p-6 rounded-xl 
            border border-purple-200/40 dark:border-purple-800/50 shadow-sm 
            backdrop-blur-md transition-all duration-300"
          >
            {chapter.summary}
          </p>

          <div className="mt-8 flex justify-center">
            <ChapterCompleteButton
              chapterId={chapter.id}
              isCompleted={!!chapter.progress[0]?.completed}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainVideoSummary;
