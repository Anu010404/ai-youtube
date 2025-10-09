import { getAuthSession } from "@/lib/auth";
import React from "react";
import { redirect } from "next/navigation";
import CreateCourseForm from "@/components/CreateCourseForm";

type Props = {};

const CreatePage = async (props: Props) => {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect("/gallery");
  }
  return <CreateCourseForm />;
};

export default CreatePage;