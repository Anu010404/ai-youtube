import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn("bg-white/5 backdrop-blur-sm border border-purple-500/30 text-purple-100 placeholder:text-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl transition-all duration-200 hover:bg-white/10 hover:border-purple-400 flex min-h-[80px] w-full px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };