"use client";
import { Question, Quiz } from "@prisma/client";
import { cn } from "@/lib/utils";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronRight, RefreshCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

type Props = {
  quiz: Quiz & {
    questions: Question[];
  };
};

const QuizPlayer = ({ quiz }: Props) => {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [showResults, setShowResults] = React.useState(false);
  const [score, setScore] = React.useState(0);

  const { mutate: saveQuizProgress } = useMutation({
    mutationFn: async (payload: { quizId: string; score: number }) => {
      const response = await axios.post("/api/quiz/progress", payload);
      return response.data;
    },
  });

  const questions = React.useMemo(() => quiz.questions || [], [quiz.questions]);

  const checkAnswer = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) correct++;
    });
    setScore(correct);
    setShowResults(true);
    saveQuizProgress({ quizId: quiz.id, score: correct });
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-purple-200 dark:from-gray-950 dark:to-purple-900">
        <Card className="w-full max-w-xl text-center bg-white/80 dark:bg-gray-900/70 shadow-2xl p-6">
         
