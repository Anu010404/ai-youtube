"use client";
import React from "react";
import { Button } from "./ui/button";
import { CheckCircle, XCircle } from "lucide-react"; // Corrected import
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
  chapterId: string;
  isCompleted: boolean;
};

const ChapterCompleteButton = ({ chapterId, isCompleted }: Props) => {
  const router = useRouter();
  const { mutate: markChapterComplete, isPending } = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post("/api/chapter/progress", {
        chapterId,
        completed: !isCompleted
      });
      return data;
    },
  });

  const handleMarkComplete = () => {
    markChapterComplete(undefined, {
      onSuccess: () => {
        toast.success("Progress updated!");
        router.refresh();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Something went wrong.");
      },
    });
  };

  const Icon = isCompleted ? CheckCircle : XCircle;

  return (
    <Button disabled={isPending} onClick={handleMarkComplete} className="w-full mt-4" >
      <Icon className="w-4 h-4 mr-2" />
      {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
    </Button>
  );
};

export default ChapterCompleteButton;