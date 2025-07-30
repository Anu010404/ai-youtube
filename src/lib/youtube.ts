import {YoutubeTranscript} from 'youtube-transcript';
import { strict_output } from './gpt';

export async function searchYouTube(searchQuery: string) {
  searchQuery = encodeURIComponent(searchQuery);
  console.count("youtube search");
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&q=${searchQuery}&videoDuration=medium&videoEmbeddable=true&type=video&maxResults=5&part=snippet`,
    {
      method: "GET",
    }
  );
  const json = await response.json();
  if (!response.ok) {
    const errorMessage = json.error?.message || "Unknown YouTube API error";
    console.error("YouTube API Error:", errorMessage);
    return null;
  }
  if (!json.items || json.items.length === 0) {
    console.log("youtube fail: no items found");
    return null;
  }
  return json.items[0].id.videoId;
}

export async function getTranscript(videoId: string) {
  try{
    let transcript_arr= await YoutubeTranscript.fetchTranscript(videoId,{
        lang: 'en'
    });
    let transcript=''
    for (let t of transcript_arr){
        transcript += t.text + ' ';
    }
    return transcript.replaceAll('\n', ' ');
  }catch(error){
    return "";
  }
 }

export async function getQuestionsFromTranscript(transcript:string,course_title:string) {
    type Question={
        question: string;
        answer: string;
        option1: string;
        option2: string;
        option3: string;
        option4: string;
    };
    const questions: Question[] = await strict_output(
        "You are a helpful AI that is able to generate a list of mcq questions and answers. The length of each answer should not be more than 15 words.",
        new Array(5).fill(
            `You are to generate a random hard mcq question about ${course_title} with context of the following transcript: ${transcript}`
        ),
        {
            question: "question",
            answer: "answer with maximum of 15 words",
            option1: "option1 with maximum of 15 words",
            option2: "option2 with maximum of 15 words",
            option3: "option3 with maximum of 15 words",
            option4: "option4 with maximum of 15 words",
        }
    );
    return questions;
}