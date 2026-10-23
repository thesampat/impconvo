// Ported from android/app/.../data/api/{ApiConfig,ApiService,RetrofitClient}.kt
import type {
  BanterRequest,
  BanterResponse,
  ConfigResponse,
  ConfigSaveRequest,
  GenerateScenarioRequest,
  GenerateScenarioResponse,
  GetOpenersRequest,
  GetOpenersResponse,
  ImproveMessageRequest,
  ImproveMessageResponse,
  InitiateChatRequest,
  InitiateChatResponse,
  MisinterpretRequest,
  MisinterpretResponse,
  SendMessageRequest,
  SendMessageResponse,
  VibeReviewRequest,
  VibeReviewResponse,
} from './types';

// Change this whenever you want to point the app at a different backend.
export const DEFAULT_BASE_URL = 'https://improveconvo-929363816987.asia-south1.run.app';

const TIMEOUT_MS = 30_000;

let baseUrl = DEFAULT_BASE_URL;
let accessCode = '';

export function setBaseUrl(url: string) {
  baseUrl = url.replace(/\/+$/, '');
}

export function setAccessCode(code: string) {
  accessCode = code;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessCode) headers['X-Code'] = accessCode;

  try {
    const res = await fetch(`${baseUrl}/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        if (data?.detail) detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      } catch {
        // body was not JSON; keep the status text
      }
      throw new ApiError(detail, res.status);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error)?.name === 'AbortError') throw new ApiError('Request timed out');
    throw new ApiError((e as Error)?.message ?? 'Network error');
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  getConfig: () => request<ConfigResponse>('GET', 'api/config'),
  saveConfig: (req: ConfigSaveRequest) => request<ConfigResponse>('POST', 'api/config', req),
  sendMessage: (req: SendMessageRequest) => request<SendMessageResponse>('POST', 'api/send-message', req),
  improveMessage: (req: ImproveMessageRequest) =>
    request<ImproveMessageResponse>('POST', 'api/improve-message', req),
  getVibeReview: (req: VibeReviewRequest) => request<VibeReviewResponse>('POST', 'api/vibe-review', req),
  initiateChat: (req: InitiateChatRequest) => request<InitiateChatResponse>('POST', 'api/initiate-chat', req),
  getOpeners: (req: GetOpenersRequest) => request<GetOpenersResponse>('POST', 'api/get-openers', req),
  getMisinterpret: (req: MisinterpretRequest) =>
    request<MisinterpretResponse>('POST', 'api/misinterpret', req),
  getBanter: (req: BanterRequest) => request<BanterResponse>('POST', 'api/banter', req),
  generateScenario: (req: GenerateScenarioRequest) =>
    request<GenerateScenarioResponse>('POST', 'api/generate-scenario', req),
};
