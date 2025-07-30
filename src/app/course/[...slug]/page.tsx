import React from "react";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CourseSideBar from "@/components/CourseSideBar";
import MainVideoSummary from "@/components/MainVideoSummary";

type Props = {
    params:{
        slug: string[];
    }
};

const CoursePage = async({params}: Props) => {
    const [courseId, unitIndexParam, chapterIndexParam] = params.slug;
    const course = await prisma.course.findUnique({
        where: {
            id: courseId,
        },
        include: {
            units: {
                include: {
                    chapters: true,
                },
            },
        },
});
if (!course) {
    return redirect('/gallery');
}
    let unitIndex = parseInt(unitIndexParam);
    let chapterIndex = parseInt(chapterIndexParam);
    const unit = course.units[unitIndex];
    if (!unit) {
        return redirect(`/gallery`);
    }
    const chapter = unit.chapters[chapterIndex];
    if (!chapter) {
        return redirect(`/gallery`);
    }
    return (
       <div>
        <CourseSideBar course={course} currentChapterId={chapter.id}/>
       <div>
            <div className="ml-[400px] px-8">
                <div className='flex'>
                <MainVideoSummary chapter={chapter} unit={unit} unitIndex={unitIndex} chapterIndex={chapterIndex}/>
                
                </div>
            </div>
       </div>
       </div> 
    )
};

export default CoursePage;
