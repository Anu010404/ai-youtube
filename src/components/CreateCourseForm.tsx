"use client";

import React from "react";
import { useRouter } from "next/navigation"; // Corrected import
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { createCourseSchema, CreateCourseSchema } from "@/validators/course";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2, Plus, Trash, ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { extractKeywords, } from "@/lib/nlp";

type Props = {};

const steps = [
  { id: 1, name: "Course Details", fields: ["title", "description", "level"] },
  { id: 2, name: "Units", fields: ["units"] as const },
  { id: 3, name: "Review & Generate" },
];

const CreateCourseForm = (props: Props) => {
  const router = useRouter();

  const { mutate: createChapters, isPending } = useMutation({
    mutationFn: async (data: CreateCourseSchema & { keywords: string[] }) => {
      const response = await axios.post("/api/course/generateCourse", data);
      return response.data;
    },
  });

  const [currentStep, setCurrentStep] = React.useState(1);
  const [keywords, setKeywords] = React.useState<string[]>([]);

  const form = useForm<CreateCourseSchema>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      level: "Beginner",
      units: ["", "", ""],
    },
  });

  const processForm = async () => {
    const data = form.getValues();
    if (data.units.some((unit) => unit === "")) {
      toast.error("Please fill all the units.");
      return;
    }
    const extractedKeywords = extractKeywords(data.title, data.description);
    setKeywords(extractedKeywords);

    const payload = { ...data, keywords: extractedKeywords };
    createChapters(payload, {
      onSuccess: ({ course_id }) => {
        toast.success("Course created successfully!");
        router.push(`/create/${course_id}`);
      },
      onError: (error) => {
        console.error("Error creating course: ", error);
        if (error instanceof AxiosError && error.response) {
          toast.error(error.response.data || "An unexpected error occurred.");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      },
    });
  }

  const next = async () => {
    const fields = steps[currentStep - 1].fields;
    const output = await form.trigger(fields, { shouldFocus: true });

    if (!output) return;

    if (currentStep < steps.length) {
      if (currentStep === steps.length - 1) {
        // This is the step before the final review, extract keywords here
        const { title, description } = form.getValues();
        setKeywords(extractKeywords(title, description));
      }
      setCurrentStep(step => step + 1);
    }
  };

  const prev = () => {
    if (currentStep > 1) {
      setCurrentStep(step => step - 1);
    }
  };

  const delta = currentStep - 1;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl bg-black/30 border border-purple-700/50 shadow-2xl shadow-purple-500/10 rounded-3xl p-8 md:p-12 transition-all duration-300">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-purple-100 drop-shadow-md">AI Course Generator</h1>
          <p className="text-purple-300 text-sm mt-2">
            Let's craft your personalized learning journey.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-12">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-purple-900/50 rounded-full" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-purple-500 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${(delta / (steps.length - 1)) * 100}%` }}
          />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center z-10">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ease-in-out ${currentStep > index ? 'bg-purple-500' : 'bg-purple-800 border-2 border-purple-600'}`}
                >
                  {currentStep > index && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className={`mt-2 text-xs transition-colors duration-500 ${currentStep > index ? 'text-purple-200' : 'text-purple-400'}`}>{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(processForm)} className="space-y-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ x: delta >= 1 ? '50%' : '-50%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-50%', opacity: 0 }} className="space-y-8">
                  {/* Step 1 Content */}
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-200 text-sm">Course Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., 'Introduction to Python'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-200 text-sm">Course Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us a little bit about what the course will cover..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="level" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-200 text-sm">Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a difficulty" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="step2" initial={{ x: delta >= 2 ? '50%' : '-50%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-50%', opacity: 0 }} className="space-y-4">
                  {/* Step 2 Content */}
                  <h3 className="text-xl font-semibold text-purple-100">Define Course Units</h3>
                  <AnimatePresence>
                    {form.watch("units").map((_, index) => (
                      <motion.div key={index} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <FormField control={form.control} name={`units.${index}`} render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-purple-200 text-sm w-16">Unit {index + 1}</FormLabel>
                              <FormControl className="flex-1">
                                <Input placeholder="E.g., 'Variables and Data Types'" {...field} />
                              </FormControl>
                              <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full p-2 transition-all duration-200" onClick={() => {
                                const newUnits = [...form.watch("units")];
                                newUnits.splice(index, 1);
                                form.setValue("units", newUnits);
                              }}>
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div className="flex justify-start">
                    <Button type="button" variant="outline" className="text-purple-300 border border-purple-500/50 hover:bg-purple-800/30 hover:border-purple-400 transition-all duration-200 rounded-xl" onClick={() => form.setValue("units", [...form.watch("units"), ""])}>
                      <Plus className="w-4 h-4 mr-2" /> Add Unit
                    </Button>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div key="step3" initial={{ x: '50%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-50%', opacity: 0 }} className="space-y-6">
                  {/* Step 3 Content */}
                  <h3 className="text-xl font-semibold text-purple-100">Review and Generate</h3>
                  <div className="p-4 bg-black/20 rounded-lg border border-purple-700/30 space-y-2">
                    <p className="text-sm text-purple-300">Title: <span className="font-medium text-purple-100">{form.getValues("title")}</span></p>
                    <p className="text-sm text-purple-300">Level: <span className="font-medium text-purple-100">{form.getValues("level")}</span></p>
                    <p className="text-sm text-purple-300">Units: <span className="font-medium text-purple-100">{form.getValues("units").length}</span></p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-purple-300">Extracted Keywords:</p>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map(keyword => (
                        <span key={keyword} className="px-3 py-1 text-xs bg-purple-800/50 text-purple-200 rounded-full">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-8 pt-5">
              <div className="flex justify-between">
                <Button type="button" onClick={prev} disabled={currentStep === 1} variant="outline" className="text-purple-300 border-purple-500/50 hover:bg-purple-800/30 disabled:opacity-50">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                </Button>

                {currentStep < steps.length - 1 && (
                  <Button type="button" onClick={next} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                    Next Step <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {currentStep === steps.length - 1 && (
                  <Button type="button" onClick={next} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                    Confirm & Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {currentStep === steps.length && (
                  <Button type="submit" disabled={isPending} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Course</>}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateCourseForm;
