import {YoutubeTranscript} from 'youtube-transcript';
import { strict_output } from './gpt';

export async function searchYouTube(searchQuery: string) {
  searchQuery = encodeURIComponent(searchQuery);
  console.count("youtube search");
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&q=${searchQuery}&videoDuration=medium&videoEmbeddable=true&type=video&maxResults=5&part=snippet`,
    {
      method: "GET",
      cache: "no-store",
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
  const videoIds = json.items
    .map((item: any) => item.id.videoId)
    .filter((id: any) => id);

  if (videoIds.length === 0) {
    console.log("youtube fail: no videoIds found in items");
    return null;
  }

  return videoIds;
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