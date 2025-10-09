import { prisma } from "@/lib/db";
import React from "react";
import GalleryCourseCard from "@/components/GalleryCourseCard";

type Props = {};

const GalleryPage = async(props: Props) => {
    const courses = await prisma.course.findMany({
        include: {
            units: {
                include: {
                    chapters: true,
                },
            },
        },
    });
  return (
    <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Gallery</h1>
        <p className="text-lg text-muted-foreground">
          Here are all the courses you have created
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {courses.map((course) => {
          return <GalleryCourseCard course={course} key={course.id} />;
        })}
      </div>
    </div>
  )
}



export default GalleryPage;