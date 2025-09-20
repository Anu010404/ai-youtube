"use client";
import React from "react";
import { Button } from "./ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type Props = {
  chapterId: string;
  isCompleted: boolean;
  canMarkComplete: boolean;
};

const ChapterCompleteButton = ({ chapterId, isCompleted, canMarkComplete }: Props) => {
  const router = useRouter();
  const { mutate: setChapterProgress, isPending } = useMutation({
    mutationFn: async (completed: boolean) => {
      const response = await axios.post("/api/chapter/progress", {
        chapterId,
        completed,
      });
      return response.data;
    },
  });

  const handleToggleComplete = () => {
    setChapterProgress(!isCompleted, {
      onSuccess: () => {
        toast.success("Success", {
          description: `Chapter marked as ${!isCompleted ? 'complete' : 'incomplete'}.`,
        });
        router.refresh();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Error", {
          description: "Something went wrong. Please try again.",
        });
      },
    });
  };

  const Icon = isCompleted ? CheckCircle : XCircle;

  const button = (
    <Button
      variant="outline"
      className="w-full md:w-auto mt-4"
      onClick={handleToggleComplete}
      disabled={isPending || !canMarkComplete}
    >
      <Icon className="w-4 h-4 mr-2" />
      {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
    </Button>
  );

  if (!canMarkComplete) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>You must complete the chapter quiz before marking it as complete.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export default ChapterCompleteButton;