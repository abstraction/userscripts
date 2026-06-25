import { GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client';
import { getCachedVideoData, setCachedVideoData } from './cache';
import type { LikesData } from './cache';
import { Logger } from '../utils/logger';

const MAX_API_RETRIES = 10;
const API_RETRY_DELAY_MIN_MS = 3000;
const API_RETRY_UNIFORM_DISTRIBUTION_WIDTH_MS = 3000;

let pendingApiRequests: Record<string, ((data: LikesData | null) => void)[]> = {};

async function fetchLikesDataFromApi(videoId: string): Promise<LikesData | null> {
  const cached = await getCachedVideoData(videoId);
  if (cached) {
    return cached;
  }

  if (pendingApiRequests[videoId]) {
    return new Promise((resolve) => {
      pendingApiRequests[videoId].push(resolve);
    });
  }

  return new Promise((resolve) => {
    pendingApiRequests[videoId] = [resolve];

    GM_xmlhttpRequest({
      method: "GET",
      url: `https://returnyoutubedislikeapi.com/Votes?videoId=${videoId}`,
      onload: (response) => {
        let likesData: LikesData | null = null;
        if (response.status === 200) {
          try {
            const parsed = JSON.parse(response.responseText);
            likesData = { likes: parsed.likes, dislikes: parsed.dislikes };
            setCachedVideoData(videoId, likesData);
          } catch (err) {
            Logger.error("[YTE] Failed to parse API response:", err);
          }
        }
        const callbacks = pendingApiRequests[videoId] || [];
        delete pendingApiRequests[videoId];
        callbacks.forEach((cb) => cb(likesData));
      },
      onerror: () => {
        const callbacks = pendingApiRequests[videoId] || [];
        delete pendingApiRequests[videoId];
        callbacks.forEach((cb) => cb(null));
      },
    });
  });
}

export interface VideoData {
  likes: number;
  dislikes: number;
  total: number;
  rating: number | null;
}

function createVideoDataObject(likes: number, dislikes: number): VideoData {
  const total = likes + dislikes;
  const rating = total ? likes / total : null;
  return { likes, dislikes, total, rating };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getVideoData(videoId: string): Promise<VideoData | null> {
  const cachedData = await getCachedVideoData(videoId);
  if (cachedData) {
    Logger.debug(`[API] Cache hit for ${videoId}`);
    return createVideoDataObject(cachedData.likes, cachedData.dislikes);
  }

  Logger.debug(`[API] Fetching data for ${videoId}`);
  for (let attempt = 0; attempt <= MAX_API_RETRIES; attempt++) {
    const likesData = await fetchLikesDataFromApi(videoId);
    if (likesData !== null) {
      Logger.debug(`[API] Successfully fetched data for ${videoId}`);
      return createVideoDataObject(likesData.likes, likesData.dislikes);
    }
    await sleep(
      API_RETRY_DELAY_MIN_MS +
        Math.random() * API_RETRY_UNIFORM_DISTRIBUTION_WIDTH_MS,
    );
  }
  
  Logger.warn(`[API] Failed to get data for ${videoId}`);
  return null;
}
