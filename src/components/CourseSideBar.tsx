import { cn } from "@/lib/utils";
import { Chapter, Course, Unit, Quiz, UserChapterProgress } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { Separator } from "./ui/separator";
import { CheckCircle, BookOpen } from "lucide-react";

type Props = {
    course: Course & {
        units: (Unit & {
            chapters: (Chapter & { progress: UserChapterProgress[] })[], 
            quizzes: Quiz[] 
        })[];
    };
    currentChapterId: string;
};

const CourseSideBar = async({course, currentChapterId}: Props) => {
    const allQuizzes = course.units.flatMap(unit => unit.quizzes);
    const finalExam = allQuizzes.find(quiz => quiz.type === 'COURSE_TEST');
    return (
        <div className="w-[400px] absolute top-1/2 -translate-y-1/2 p-8 rounded-r-3xl bg-secondary h-screen overflow-y-auto">
            <h1 className="text-4xl font-bold">{course.name}</h1>
            {course.units.map((unit, unitIndex) => {
                return (
                    <div key={unit.id} className="mt-4">
                        <h2 className="text-sm uppercase text-secondary-foreground/60">Unit {unitIndex + 1}</h2>
                        <h2 className="text-2xl font-bold uppercase">{unit.name}</h2>
                        {unit.chapters.map((chapter, chapterIndex) => {
                            const isCompleted = chapter.progress.length > 0 && chapter.progress[0].completed;
                            return (
                                <Link
                                    href={`/course/${course.id}/${unitIndex}/${chapterIndex}`}
                                    key={chapter.id}
                                    className={cn('flex items-center text-secondary-foreground/60 mt-2', {
                                        'text-green-500 font-bold': chapter.id === currentChapterId,
                                        'hover:text-primary': chapter.id !== currentChapterId,
                                    })}
                                >
                                    {isCompleted ? (
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                    ) : (
                                        <BookOpen className="w-4 h-4 mr-2" />
                                    )}
                                    <span className="truncate">{chapter.name}</span>
                                </Link>
                            )
                        })}
                        {/* Display Unit Tests */}
                        {unit.quizzes.filter(q => q.type === 'UNIT_TEST').map((quiz) => {
                            return (
                                <div key={quiz.id}>
                                    <Link href={`/quiz/${quiz.id}`} className="block mt-2 text-secondary-foreground/60 hover:text-primary pl-6">
                                        - {quiz.name}
                                    </Link>
                                </div>
                            )
                        })}
                    <Separator className="mt-2 text-gray-500 bg-gray-500"/>
                    </div>
                )
            })
            }
            {finalExam && (
                <div className="mt-6">
                    <h2 className="text-sm uppercase text-secondary-foreground/60">Final Exam</h2>
                    <Link href={`/quiz/${finalExam.id}`} className="block mt-2 font-semibold text-primary hover:underline">
                        {finalExam.name}
                    </Link>
                </div>
            )}
        </div>
    )
}
export default CourseSideBar;