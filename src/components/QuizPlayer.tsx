"use client";
import { Question, Quiz } from "@prisma/client";
import { cn } from "@/lib/utils";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
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
  const [questionState, setQuestionState] = React.useState<
    Record<string, boolean | null>
  >({});
  const [showResults, setShowResults] = React.useState(false);
  const [score, setScore] = React.useState(0);

  const { mutate: saveQuizProgress } = useMutation({
    mutationFn: async (payload: { quizId: string; score: number }) => {
      const response = await axios.post("/api/quiz/progress", payload);
      return response.data;
    },
  });

  const questions = React.useMemo(() => quiz.questions || [], [quiz.questions]);

  const checkAnswer = React.useCallback(() => {
    const newQuestionState: Record<string, boolean | null> = {};
    let correctAnswers = 0;
    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.answer;
      newQuestionState[question.id] = isCorrect;
      if (isCorrect) correctAnswers++;
    });
    setQuestionState(newQuestionState);
    setScore(correctAnswers);
    setShowResults(true);

    saveQuizProgress(
      { quizId: quiz.id, score: correctAnswers },
      {
        onSuccess: () => {
          toast.success("Quiz progress saved!");
        },
        onError: () => {
          toast.error("Failed to save quiz progress.");
        },
      }
    );
  }, [answers, questions, quiz.id, saveQuizProgress]);

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{quiz.name}</CardTitle>
            <CardDescription>
              This quiz does not have any questions yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/gallery">
              <Button>Back to Gallery</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{quiz.name}</CardTitle>
          <CardDescription>Test your knowledge.</CardDescription>
        </CardHeader>
        <CardContent>
          {showResults && (
            <div className="text-center font-semibold text-lg mb-4">
              You scored {score} out of {questions.length}!
            </div>
          )}
          {questions.map((question, index) => {
            const options = Array.isArray(question.options)
              ? (question.options as string[])
              : [];
            return (
              <div key={question.id} className="my-4">
                <p className="font-semibold">
                  {index + 1}. {question.question}
                </p>
                <div className="flex flex-col mt-2">
                  {options.map((option) => {
                    const isSelected = answers[question.id] === option;
                    const isCorrect = option === question.answer;
                    return (
                      <Button
                        key={option}
                        variant={isSelected ? "default" : "secondary"}
                        className={cn(
                          "w-full justify-start my-1 h-auto py-2 text-left",
                          {
                            "bg-green-700 text-white hover:bg-green-700":
                              showResults && isCorrect,
                            "bg-red-700 text-white hover:bg-red-700":
                              showResults && !isCorrect && isSelected,
                          }
                        )}
                        onClick={() => {
                          if (showResults) return;
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: option,
                          }));
                        }}
                        disabled={showResults}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="mt-4 w-full max-w-4xl">
        {showResults ? (
          <div className="flex justify-between items-center">
            <Link href="/gallery">
              <Button variant="secondary">Back to Gallery</Button>
            </Link>
            <Button
              onClick={() => {
                setAnswers({});
                setQuestionState({});
                setShowResults(false);
                setScore(0);
              }}
            >
              Retake Quiz
              <RefreshCcw className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={checkAnswer}
            disabled={Object.keys(answers).length !== questions.length}
          >
            Check Answers
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;