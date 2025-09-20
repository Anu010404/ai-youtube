'use client';
import { Chapter, Course, Unit } from "@prisma/client";
import React from "react";
import { Separator } from "./ui/separator";
import Link from "next/link";
import { Button } from "./ui/button";

type Props = {
    course: Course & {
        units:(Unit & {
            chapters: Chapter[];
        }
        )[];
    }
};

const ConfirmChapters = ({course}: Props) => {
    return (
        <div className="w-full mt-4">
            {course.units.map((unit, unitIndex)  => {
                return (
                    <div key={unit.id} className="mt-5">
                        <h2 className="text-sm uppercase text-secondary-foreground/60">
                            Unit {unitIndex + 1}
                        </h2>
                        <h3 className="text-2xl font-bold">{unit.name}</h3>
                        <div className="mt-3"> 
                            {unit.chapters.map((chapter, chapterIndex) => {
                                return (
                                    <div key={chapter.id} className="flex items-center py-2 border-b">
                                        <p className="text-secondary-foreground/80">{chapterIndex + 1}. {chapter.name}</p>
                                    </div>
                                )
                            })}
                        </div><Separator className="my-4" />
                    </div>
                )
            })}
            <Link href={`/course/${course.id}/0/0`} className="w-full mt-8">
                <Button className="w-full">Start Learning</Button>
            </Link>
        </div>
    );
};

export default ConfirmChapters;