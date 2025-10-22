import { YoutubeTranscript } from 'youtube-transcript';
import YTDlpWrap from 'yt-dlp-wrap';
import { pipeline } from '@xenova/transformers';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { WaveFile } from 'wavefile';
import logger from './logger';

// Initialize Google Translate client
const translate = new Translate();

/**
 * Fetches a transcript using the youtube-transcript library.
 * @param videoId The ID of the YouTube video.
 * @returns The transcript text or null if not available.
 */
async function fetchTranscriptFromYouTube(videoId: string): Promise<string | null> {
    try {
        logger.info(`Attempting to fetch transcript for ${videoId} via API.`);
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        if (transcript && transcript.length > 0) {
            logger.info(`Successfully fetched transcript for ${videoId} via API.`);
            return transcript.map(item => item.text).join(' ');
        }
        return null;
    } catch (error) {
        logger.warn(`Could not fetch transcript from youtube-transcript for ${videoId}. Error: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

/**
 * Downloads the audio from a YouTube video.
 * @param videoId The ID of the YouTube video.
 * @returns The file path to the downloaded audio.
 */
async function downloadAudio(videoId: string): Promise<string> {
    const ytDlpWrap = new YTDlpWrap();
    const tempDir = os.tmpdir();
    const fileName = `${uuidv4()}.mp3`;
    const outputPath = path.join(tempDir, fileName);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    logger.info(`Downloading audio for ${videoUrl} to ${outputPath}`);
    await ytDlpWrap.exec([
        videoUrl,
        '-x', // Extract audio
        '--audio-format', 'mp3',
        '-f', 'bestaudio', // Best audio quality
        '-o', outputPath,
    ]);
    logger.info(`Successfully downloaded audio to ${outputPath}`);
    return outputPath;
}

/**
 * Transcribes an audio file using the Whisper model.
 * @param filePath The path to the audio file.
 * @returns An object containing the transcribed text and detected language.
 */
async function transcribeAudio(filePath: string): Promise<{ text: string; language: string }> {
    try {
        logger.info(`Starting transcription for ${filePath}. This may take a moment...`);
        
        // Use a smaller, faster model for quicker processing: 'Xenova/whisper-tiny'
        // For higher accuracy, use 'Xenova/whisper-base' or 'Xenova/whisper-small'
        const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base');

        // Read the audio file and convert it to a format that the model can process.
        const buffer = await fs.readFile(filePath);
        const wav = new WaveFile(buffer);

        // Ensure the audio is in the format Whisper expects: 16kHz, 32-bit float, single-channel
        wav.toBitDepth('32f');
        wav.toSampleRate(16000);
        if (wav.fmt.numChannels > 1) {
            wav.toMono();
        }

        let audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
            audioData = audioData[0];
        }

        const output = await transcriber(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
        });

        // @ts-ignore
        const text = output.text as string;
        // @ts-ignore
        const language = transcriber.tokenizer.language || 'en';

        logger.info(`Transcription complete for ${filePath}. Detected language: ${language}`);
        return { text, language };
    } catch (error) {
        logger.error(`Error during transcription for ${filePath}:`, error);
        throw new Error('Failed to transcribe audio.');
    }
}

/**
 * Translates text to English if it's not already in English.
 * @param text The text to translate.
 * @param originalLanguage The BCP-47 language code of the text.
 * @returns The translated English text.
 */
async function translateTextIfNeeded(text: string, originalLanguage: string): Promise<{ translatedText: string, isTranslated: boolean }> {
    if (!originalLanguage || originalLanguage.startsWith('en')) {
        logger.info('Text is already in English. No translation needed.');
        return { translatedText: text, isTranslated: false };
    }

    try {
        logger.info(`Translating text from ${originalLanguage} to English.`);
        const [translation] = await translate.translate(text, 'en');
        logger.info('Translation successful.');
        return { translatedText: translation, isTranslated: true };
    } catch (error) {
        logger.error(`Failed to translate text from ${originalLanguage}:`, error);
        // Return original text if translation fails
        return { translatedText: text, isTranslated: false };
    }
}

/**
 * Deletes a file from the filesystem.
 * @param filePath The path to the file to delete.
 */
async function cleanupFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath);
        logger.info(`Successfully deleted temporary file: ${filePath}`);
    } catch (error) {
        logger.warn(`Could not delete temporary file: ${filePath}. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

interface TranscriptResult {
    originalLanguage: string;
    isTranslated: boolean;
    transcript: string | null;
}

/**
 * Main service function to get a video transcript.
 * It tries fetching from the YouTube API first, then falls back to
 * downloading, transcribing, and translating.
 * @param videoId The ID of the YouTube video.
 * @returns The final transcript result.
 */
export async function getAdvancedTranscript(videoId: string): Promise<TranscriptResult> {
    // 1. Try to fetch the transcript directly
    const apiTranscript = await fetchTranscriptFromYouTube(videoId);
    if (apiTranscript) {
        return {
            originalLanguage: 'en', // youtube-transcript often doesn't provide language, assume English
            isTranslated: false,
            transcript: apiTranscript,
        };
    }

    logger.info(`API transcript not found for ${videoId}. Falling back to ASR.`);

    // 2. Fallback: Download audio and transcribe
    let audioFilePath: string | null = null;
    try {
        audioFilePath = await downloadAudio(videoId);
        const { text: rawTranscript, language } = await transcribeAudio(audioFilePath);

        // 3. Translate if necessary
        const { translatedText, isTranslated } = await translateTextIfNeeded(rawTranscript, language);

        return {
            originalLanguage: language,
            isTranslated: isTranslated,
            transcript: translatedText,
        };
    } catch (error) {
        logger.error(`An error occurred in the ASR fallback process for ${videoId}:`, error);
        // Return null transcript on failure to avoid breaking the calling function
        return {
            originalLanguage: 'unknown',
            isTranslated: false,
            transcript: null,
        }
    } finally {
        // 4. Clean up the temporary audio file
        if (audioFilePath) {
            await cleanupFile(audioFilePath);
        }
    }
}
