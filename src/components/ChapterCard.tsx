'use client';
import { Chapter } from "@prisma/client";
import React, { useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
    chapter: Chapter;
    chapterIndex: number;
    completedChapters: Set<String>;
    setCompletedChapters: React.Dispatch<React.SetStateAction<Set<String>>>;

};

export type ChapterCardHandler = {
    triggerLoad: () => void;
};

const ChapterCard = React.forwardRef<ChapterCardHandler, Props>(({ chapter, chapterIndex, setCompletedChapters }, ref) => {
    const [success, setSuccess] = React.useState<boolean | null>(null);
    const { mutate: getChapterInfo, isPending } = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/chapter/getInfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chapterId: chapter.id }),
            });
            return await response.json();
        },
        onSuccess: () => {
            setSuccess(true);
            addChapterIdToSet();
        },
        onError: (error) => {
            console.error(error);
            setSuccess(false);
            toast.error("Error loading chapter");
            addChapterIdToSet();
        }
    });
    const addChapterIdToSet = React.useCallback(() =>{
        setCompletedChapters((prev) =>{
            const newSet = new Set(prev);
            newSet.add(chapter.id);
            return newSet;
        });
    },[chapter.id, setCompletedChapters])

    React.useEffect(() => {
        if (chapter.videoId) {
            setSuccess(true);
            addChapterIdToSet();
        }
    }, [chapter, addChapterIdToSet]);
    
    useImperativeHandle(ref, () => ({
        triggerLoad: () => {
            if (chapter.videoId) {
                addChapterIdToSet();
                return;
            }
            getChapterInfo();
        },
    }));

    return (
        <div className={cn('px-4 py-2 mt-2 rounded flex justify-between items-center', {
            'bg-secondary': success === null,
            'bg-green-500': success === true,
            'bg-red-500': success === false,
        })}>
            <h5>Chapter {chapterIndex + 1} {chapter.name}</h5>
            {isPending && <Loader2 className="animate-spin" />}
        </div>
    )
});
ChapterCard.displayName = 'ChapterCard';

export default ChapterCard;