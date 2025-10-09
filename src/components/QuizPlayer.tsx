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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

type Props = {
  quiz: Quiz & {
    questions: Question[];
  };
};

const QuizPlayer = ({ quiz }: Props) => {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [showResults, setShowResults] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);

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

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-purple-200 dark:from-gray-950 dark:to-purple-900">
        <Card className="w-full max-w-xl text-center bg-white/80 dark:bg-gray-900/70 shadow-2xl p-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">No Questions Found</CardTitle>
            <CardDescription>
              This quiz does not have any questions yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  // The 'options' field from Prisma with a JSON type is already a JavaScript array.
  // We just need to ensure it's treated as one.
  const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];

  if (showResults) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-green-200 dark:from-gray-950 dark:to-green-900">
            <Card className="w-full max-w-xl text-center bg-white/90 dark:bg-gray-900/80 shadow-2xl p-8">
                <CardHeader>
                    <CardTitle className="text-4xl font-extrabold text-green-600 dark:text-green-400">Quiz Completed!</CardTitle>
                    <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                        You scored {score} out of {questions.length}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <p className="text-xl">
                        {score > questions.length / 2 ? "Great job!" : "Better luck next time!"}
                    </p>
                    <div className="flex gap-4 mt-4">
                        <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Link href="/gallery">Explore More Quizzes</Link>
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-purple-200 dark:from-gray-950 dark:to-purple-900">
      <Card className="w-full max-w-2xl bg-white/80 dark:bg-gray-900/70 shadow-2xl p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{quiz.name}</CardTitle>
          <CardDescription>
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold mb-4">{currentQuestion.question}</div>
          <RadioGroup
            value={answers[currentQuestion.id]}
            onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
          >
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} />
                <Label htmlFor={`${currentQuestion.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <div className="flex justify-between mt-4">
          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext} disabled={!answers[currentQuestion.id]}>
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={checkAnswer} disabled={Object.keys(answers).length !== questions.length}>
              Check Answer
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default QuizPlayer;