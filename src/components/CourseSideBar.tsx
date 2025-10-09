import { cn } from "@/lib/utils";
import { Chapter, Course, Unit, Quiz, UserChapterProgress } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { Separator } from "./ui/separator";
import { CheckCircle, BookOpen } from "lucide-react";

type Props = {
  course: Course & {
    units: (Unit & {
      chapters: (Chapter & { progress: UserChapterProgress[] })[];
      quizzes: Quiz[];
    })[];
  };
  currentChapterId: string;
};

const CourseSideBar = async ({ course, currentChapterId }: Props) => {
  const allQuizzes = course.units.flatMap((unit) => unit.quizzes);
  const finalExam = allQuizzes.find((quiz) => quiz.type === "COURSE_TEST");

  return (
    <div className="fixed left-0 top-0 w-80 h-screen bg-gradient-to-b from-[#1a0033] via-[#25004d] to-[#330066] text-white shadow-[0_0_35px_rgba(128,0,255,0.25)] border-r border-purple-900/50 overflow-y-auto flex flex-col">
      {/* Sidebar Header */}
      <div className="sticky top-0 bg-[#1a0033]/90 backdrop-blur-md z-20 p-5 border-b border-purple-700/40 shadow-lg">
        <h1 className="text-2xl font-extrabold text-purple-300 tracking-wide leading-tight drop-shadow-[0_0_10px_rgba(186,85,211,0.6)]">
          {course.name}
        </h1>
        <Separator className="mt-2 border-purple-600/40" />
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 px-5 py-4 space-y-5">
        {course.units.map((unit, unitIndex) => (
          <div
            key={unit.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-purple-800/30 hover:border-purple-500/70 hover:shadow-[0_0_12px_rgba(155,50,255,0.4)] transition-all duration-300"
          >
            <h2 className="text-lg font-semibold mb-3 text-purple-200 tracking-wide">
              {unit.name}
            </h2>

            <div className="flex flex-col gap-2">
              {unit.chapters.map((chapter, chapterIndex) => {
                const isCompleted = chapter.progress.length > 0 && chapter.progress[0].completed;
                const isActive = chapter.id === currentChapterId;
                return (
                  <Link
                    href={`/course/${course.id}/${unitIndex}/${chapterIndex}`}
                    key={chapter.id}
                    className={cn(
                      "flex items-center p-2 rounded-md text-sm font-medium transition-all duration-300 truncate border border-transparent",
                      isActive
                        ? "bg-purple-700/90 text-white shadow-[0_0_12px_rgba(186,85,211,0.4)] border-purple-600/60"
                        : "hover:bg-purple-700/40 hover:border-purple-500/60 hover:shadow-[0_0_10px_rgba(155,50,255,0.3)] text-purple-100"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    ) : (
                      <BookOpen className="w-5 h-5 mr-3 text-purple-300" />
                    )}
                    <span className="truncate">{chapter.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Unit Quiz Section */}
            {unit.quizzes
              .filter((q) => q.type === "UNIT_TEST")
              .map((quiz) => (
                <div key={quiz.id} className="mt-3">
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="block px-2 py-2 text-purple-200/80 hover:text-white hover:bg-purple-700/40 rounded-md text-sm font-medium border border-transparent hover:border-purple-500/60 hover:shadow-[0_0_10px_rgba(155,50,255,0.3)] transition-all"
                  >
                    📝 {quiz.name}
                  </Link>
                </div>
              ))}
          </div>
        ))}

        {/* Final Exam Section */}
        {finalExam && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-purple-800/30 hover:border-purple-500/70 hover:shadow-[0_0_15px_rgba(155,50,255,0.4)] transition-all duration-300">
            <h2 className="text-lg font-semibold mb-2 text-purple-200">🏆 Final Exam</h2>
            <Link
              href={`/quiz/${finalExam.id}`}
              className="block px-3 py-2 text-purple-100 font-semibold rounded-md hover:bg-purple-700/60 border border-transparent hover:border-purple-500/60 transition-all"
            >
              {finalExam.name}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSideBar;
