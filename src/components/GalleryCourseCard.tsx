"use client";

import { Chapter, Course, Unit } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";

type Props = {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
};

const GalleryCourseCard = ({ course }: Props) => {
  const router = useRouter();

  const { mutate: deleteCourse, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/course/${course.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete course.");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Course deleted successfully.");
      router.push("/gallery");
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to delete course", error);
      toast.error(error.message || "An unexpected error occurred.");
    },
  });

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm("Are you sure you want to delete this course? This action cannot be undone.")
    ) {
      deleteCourse();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative w-full max-w-sm rounded-2xl overflow-hidden
      bg-gradient-to-br from-[#1b0033aa] via-[#26004faa] to-[#330075aa]
      backdrop-blur-xl border border-purple-400/20
      shadow-[0_0_25px_rgba(100,0,200,0.25)]
      hover:shadow-[0_0_35px_rgba(150,50,255,0.5)]
      transition-all duration-500 ease-out"
    >
      <Link href={`/course/${course.id}/0/0`} className="block">
        <div className="relative h-44 w-full overflow-hidden rounded-t-2xl">
          <Image
            src={course.image || "/placeholder.jpg"}
            alt={course.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-700 group-hover:scale-110 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          <h3 className="absolute bottom-3 left-4 text-xl font-semibold text-white drop-shadow-[0_0_10px_rgba(180,100,255,0.6)]">
            {course.name}
          </h3>
        </div>
      </Link>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Delete course"
        className="absolute top-3 right-3 p-2 bg-red-600/70 text-white rounded-full 
        opacity-0 group-hover:opacity-100 transition-all duration-300 
        hover:bg-red-700/80 backdrop-blur-md shadow-[0_0_10px_rgba(255,0,0,0.5)]"
      >
        <Trash className="w-4 h-4" />
      </button>

      {/* Card Content */}
      <div className="p-5 bg-white/5 backdrop-blur-lg border-t border-purple-400/20 rounded-b-2xl">
        <h4 className="text-sm font-medium text-purple-200 mb-3 uppercase tracking-wider">
          Units
        </h4>

        <div className="space-y-2">
          {course.units.length > 0 ? (
            course.units.slice(0, 3).map((unit, unitIndex) => (
              <Link
                href={`/course/${course.id}/${unitIndex}/0`}
                key={unit.id}
                className="block text-sm text-purple-100/90 hover:text-white hover:underline truncate transition-all duration-300"
              >
                {unit.name}
              </Link>
            ))
          ) : (
            <p className="text-sm text-purple-300/70 italic">No units yet</p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-purple-400/20 text-xs text-purple-300/80">
          {course.units.length} unit{course.units.length !== 1 && "s"}
        </div>
      </div>
    </motion.div>
  );
};

export default GalleryCourseCard;
