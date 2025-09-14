"use client";

import { Chapter, Course, Unit } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
};

const GalleryCourseCard = ({ course }: Props) => {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch(`/api/course/${course.id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          toast.success("Course deleted successfully.");
          router.refresh();
        } else {
          const errorText = await response.text();
          console.error("Deletion failed:", response.status, errorText);
          toast.error(`Failed to delete course. Server responded: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error("Failed to delete course", error);
        toast.error("An unexpected error occurred.");
      }
    }
  };

  return (
    <>
      <div className="border border-secondary rounded-lg">
        <div className="relative">
          <Link href={`/course/${course.id}/0/0`} className="relative block w-fit">
            <Image
              src={course.image || ""}
              alt={course.name}
              width={300}
              height={300}
              className="w-full  max-h-[300px] object-cover rounded-t-lg"
            />
            <span className="absolute px-2 py-1 text-white rounded-md bg-black/60 w-fit bottom-2 left-2">
              {course.name}
            </span>
          </Link>
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 p-1.5 bg-red-500/60 hover:bg-red-500 rounded-md transition-colors"
            title="Delete course"
          >
            <Trash className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-4">
          <h4 className="text-sm text-secondary-foreground/60">Units</h4>
          <div className="space-y-1">
            {course.units.map((unit, unitIndex) => {
              return (
                <Link
                  href={`/course/${course.id}/${unitIndex}/0`}
                  key={unit.id}
                  className="block underline w-fit"
                >
                  {unit.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default GalleryCourseCard;