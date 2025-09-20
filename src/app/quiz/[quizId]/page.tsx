import QuizPlayer from "@/components/QuizPlayer";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: {
    quizId: string;
  };
};

const QuizPage = async ({ params: { quizId } }: Props) => {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect("/");
  }

  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
    },
    include: {
      questions: true,
    },
  });

  if (!quiz) {
    return redirect("/gallery");
  }

  return <QuizPlayer quiz={quiz} />;
};

export default QuizPage;