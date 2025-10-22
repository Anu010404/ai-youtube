import { NextResponse } from 'next/server';
import { getAdvancedTranscript } from '@/lib/transcript';
import logger from '@/lib/logger';

export async function POST(req: Request) {
    const { videoUrl } = await req.json();

    if (!videoUrl || typeof videoUrl !== 'string') {
        return new NextResponse(
            JSON.stringify({ error: 'videoUrl is required and must be a string.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Extract video ID from URL
    let videoId: string | null = null;
    try {
        const url = new URL(videoUrl);
        if (url.hostname === 'youtu.be') {
            videoId = url.pathname.slice(1);
        } else if (url.hostname.includes('youtube.com')) {
            videoId = url.searchParams.get('v');
        }
        if (!videoId) throw new Error('Invalid URL');
    } catch (error) {
        return new NextResponse(
            JSON.stringify({ error: 'Invalid YouTube URL provided.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }


    try {
        logger.info(`Received request for transcript of: ${videoUrl}`);
        const result = await getAdvancedTranscript(videoId);

        if (!result.transcript) {
             return new NextResponse(
                JSON.stringify({ error: 'Failed to generate transcript for the video.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        logger.error(`Failed to process transcript for ${videoUrl}:`, error);
        return new NextResponse(
            JSON.stringify({ error: 'An internal server error occurred.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
