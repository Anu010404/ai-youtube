"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import z from "zod";
import { createChaptersSchema } from "@/validators/course";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Loader2, Plus, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

type Props = {};
type Input = z.infer<typeof createChaptersSchema>;

const CreateCourseForm = (props: Props) => {
  const router = useRouter();

  const { mutate: createChapters, isPending } = useMutation({
    mutationFn: async ({ title, units }: Input) => {
      const response = await axios.post("/api/course/createChapters", { title, units });
      return response.data;
    },
  });

  const form = useForm<Input>({
    resolver: zodResolver(createChaptersSchema),
    defaultValues: {
      title: "",
      units: ["", "", ""],
    },
  });

  function onSubmit(data: Input) {
    if (data.units.some((unit) => unit === "")) {
      toast.error("Please fill all the units.");
      return;
    }
    createChapters(data, {
      onSuccess: ({ course_id }) => {
        toast.success("Course created successfully!");
        router.push(`/create/${course_id}`);
      },
      onError: (error) => {
        console.error("Error creating course: ", error);
        if (axios.isAxiosError(error) && error.response) {
          toast.error(error.response.data || "An unexpected error occurred.");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      },
    });
  }

  form.watch();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl bg-purple-900 border border-purple-700 shadow-2xl rounded-3xl p-10 transition-all duration-300">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-purple-100 drop-shadow-md">Create a New Course</h1>
          <p className="text-purple-300 text-sm mt-2">
            Give your course a title and define its core units.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Course Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-200 text-sm">Course Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., 'Introduction to Python'"
                      className="bg-white/5 backdrop-blur-sm border border-purple-500/30 text-purple-100 placeholder:text-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl transition-all duration-200 hover:bg-white/10 hover:border-purple-400"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Units */}
            <div className="space-y-4">
              <AnimatePresence>
                {form.watch("units").map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FormField
                      control={form.control}
                      name={`units.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-200 text-sm">
                            Unit {index + 1}
                          </FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl className="flex-1">
                              <Input
                                placeholder="E.g., 'Variables and Data Types'"
                                className="bg-white/5 backdrop-blur-sm border border-purple-500/30 text-purple-100 placeholder:text-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl transition-all duration-200 hover:bg-white/10 hover:border-purple-400"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full p-2 transition-all duration-200"
                              onClick={() => {
                                const newUnits = [...form.watch("units")];
                                newUnits.splice(index, 1);
                                form.setValue("units", newUnits);
                              }}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add Unit Button */}
            <div className="flex justify-start">
              <Button
                type="button"
                variant="outline"
                className="text-purple-300 border border-purple-500/50 hover:bg-purple-800/30 hover:border-purple-400 transition-all duration-200 rounded-xl"
                onClick={() => form.setValue("units", [...form.watch("units"), ""])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Unit
              </Button>
            </div>

            <Separator className="bg-purple-700/40" />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-8 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-400/40"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Course"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateCourseForm;
