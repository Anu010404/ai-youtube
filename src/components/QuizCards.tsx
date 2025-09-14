'use client'
import { cn } from '@/lib/utils';
import { Chapter, Question } from '@prisma/client'
import React from 'react'
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { ChevronRight } from 'lucide-react';

type Props = {
    chapter: Chapter & {
        questions: Question[];
    }
}

const QuizCards = ({chapter}: Props) => {
    const [answers,setAnswers] = React.useState<Record<string, string>>({});
    const [questionState, setQuestionState] = React.useState<Record<string, boolean | null>>({})
    
    const checkAnswers = React.useCallback(() => {
        const newQuestionState: Record<string, boolean | null> = {};
        chapter.questions.forEach((question) => {
            const userAnswer = answers[question.id];
            if (userAnswer) {
                newQuestionState[question.id] = userAnswer === question.answer;
            }
        });
        setQuestionState(newQuestionState);
    }, [answers, chapter.questions]);

    return (
        <div className="flex-[1]mt-18 ml-8">
            <h1 className='text-2xl font-bold'>Concept Check</h1>
            <div className='mt-2'>
                {chapter.questions.map(question => {
                    const options = question.options as string[];
                    return <div key={question.id}
                    className={cn(
                        'p-3 mt-4 border border-secondary rounded-lg',{
                            'bg-green-700 text-white': questionState[question.id] === true,
                            'bg-red-700 text-white': questionState[question.id] === false,
                            'bg-secondary': questionState[question.id] === null
                        }
                    )}
                    >
                       <h1 className='text-lg font-semibold'>{question.question}</h1>
                       <div className='mt-2'>
                        <RadioGroup
                        onValueChange={(e)=> {
                            setAnswers((prev) => {
                                return {
                                    ...prev, [question.id]: e
                                }
                            })
                        }}
                        >
                            {options.map((option, index) => {
                                return(
                                    <div key={index} className='flex items-center space-x-2 '>
                                    <RadioGroupItem value={option} id={question.id + index.toString()} className='w-5 h-5 border border-secondary rounded-full focus:ring-2 focus:ring-offset-2 focus:ring-primary'/>
                                    <Label htmlFor={question.id + index.toString()}>{option}</Label>
                                </div>
                                )
                            })}
                        </RadioGroup>
                        </div> 
                    </div>;
                })}
            </div>
            <Button className='w-full mt-2' size={'lg'} onClick={checkAnswers}>
              Check Answers  
            <ChevronRight className='w-4 h-4 ml-1'/>
            </Button>
        </div>
    )
}

export default QuizCards