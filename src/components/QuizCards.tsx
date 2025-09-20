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

  // Correctly and safely access the questions from the nested quiz object
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
            toast.success("Quiz progress saved!");
          },
          onError: () => {
            toast.error("Failed to save quiz progress.");
          },
        }
      );
    }
  }, [answers, questions, chapter.quiz, saveQuizProgress]);

  if (questions.length === 0) {
    return (
        <div className="flex-[1] ml-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">{chapter.quiz?.name || 'Quiz'}</CardTitle>
                    <CardDescription>No questions available for this chapter's quiz.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex-[1] ml-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{chapter.quiz?.name || 'Chapter Quiz'}</CardTitle>
          <CardDescription>
            Test your knowledge on what you have learned in this chapter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showResults && (
            <div className="text-center font-semibold text-lg mb-4">
              You scored {score} out of {questions.length}!
            </div>
          )}
          {questions.map((question, index) => {
            // The 'options' field from Prisma is already a JSON array (JsonValue).
            // We just need to ensure it's an array before mapping.
            const options = Array.isArray(question.options)
              ? (question.options as string[])
              : [];
            return (
              <div key={question.id} className="my-4">
                <p className="font-semibold">{index + 1}. {question.question}</p>
                <div className="flex flex-col mt-2">
                  {options.map((option) => {
                    const isSelected = answers[question.id] === option;
                    const isCorrect = option === question.answer;
                    return (
                      <Button
                        key={option}
                        variant={isSelected ? "default" : "secondary"}
                        className={cn("w-full justify-start my-1 h-auto py-2 text-left", {
                          "bg-green-700 text-white hover:bg-green-700": showResults && isCorrect,
                          "bg-red-700 text-white hover:bg-red-700": showResults && !isCorrect && isSelected,
                        })}
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
      {showResults ? (
        <Button className="w-full mt-2" onClick={() => {
          setAnswers({});
          setQuestionState({});
          setShowResults(false);
          setScore(0);
        }}>
          Retake Quiz
          <RefreshCcw className="w-4 h-4 ml-2" />
        </Button>
      ) : (
        <Button className="w-full mt-2" onClick={checkAnswer} disabled={Object.keys(answers).length !== questions.length}>
          Check Answers
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
};

export default QuizCards;