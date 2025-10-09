"use client";
import { Chapter, Question, Quiz } from "@prisma/client";
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

type Props = {
  chapter: Chapter & {
    quiz: (Quiz & {
      questions: Question[];
    }) | null;
  };
};

const QuizCards = ({ chapter }: Props) => {
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

  const questions = React.useMemo(() => chapter.quiz?.questions || [], [chapter.quiz]);

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

    if (chapter.quiz) {
      saveQuizProgress(
        { quizId: chapter.quiz.id, score: correctAnswers },
        {
          onSuccess: () => {
            toast.success("✨ Quiz progress saved!");
          },
          onError: () => {
            toast.error("❌ Failed to save quiz progress.");
          },
        }
      );
    }
  }, [answers, questions, chapter.quiz, saveQuizProgress]);

  if (questions.length === 0) {
    return (
      <div className="flex-[1] ml-8">
        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {chapter.quiz?.name || "Quiz"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              No questions available for this chapter’s quiz.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-[1] ml-8">
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl hover:shadow-purple-300/40 transition-all duration-200">
        <CardHeader className="pb-4 space-y-1">
          <CardTitle className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {chapter.quiz?.name || "Chapter Quiz"}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Test your understanding of this chapter below.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {showResults && (
            <div className="text-center font-semibold text-lg text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg shadow-inner">
              🌟 You scored {score} out of {questions.length}!
            </div>
          )}

          {questions.map((question, index) => {
            const options = Array.isArray(question.options)
              ? (question.options as string[])
              : [];
            return (
              <div
                key={question.id}
                className="my-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:shadow-md hover:border-purple-300/60 transition-all"
              >
                <p className="font-semibold text-lg text-foreground mb-3">
                  {index + 1}. {question.question}
                </p>
                <div className="flex flex-col gap-2">
                  {options.map((option) => {
                    const isSelected = answers[question.id] === option;
                    const isCorrect = option === question.answer;
                    return (
                      <Button
                        key={option}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "w-full justify-start py-3 text-left rounded-lg transition-all border font-medium",
                          {
                            "bg-purple-600 text-white hover:bg-purple-600":
                              showResults && isCorrect,
                            "bg-red-600 text-white hover:bg-red-600":
                              showResults && !isCorrect && isSelected,
                            "border-purple-400/60 hover:bg-purple-100 hover:text-purple-800 dark:hover:bg-purple-900/40":
                              !showResults,
                            "ring-2 ring-purple-400":
                              isSelected && !showResults,
                          }
                        )}
                        onClick={() => {
                          if (showResults) return;
                          setAnswers((prev) => ({ ...prev, [question.id]: option }));
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

      <div className="mt-6">
        {showResults ? (
          <Button
            className="w-full py-3 text-lg rounded-lg shadow-md bg-purple-600 hover:bg-purple-700 text-white"
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
        ) : (
          <Button
            className="w-full py-3 text-lg rounded-lg shadow-md bg-purple-600 hover:bg-purple-700 text-white"
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

export default QuizCards;
