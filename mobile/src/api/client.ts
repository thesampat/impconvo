// Ported from android/app/.../data/api/{ApiConfig,ApiService,RetrofitClient}.kt
import type {
  AnalyzeScenarioRequest,
  AdminSettings,
  AdminSettingsPatch,
  AdminUsage,
  AnalyzeScenarioResponse,
  BanterRequest,
  BanterResponse,
  ConfigResponse,
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

import { Platform } from 'react-native';

// Change this whenever you want to point the app at a different backend.
export const DEFAULT_BASE_URL = 'https://improveconvo-929363816987.asia-south1.run.app';

// The web build in development talks to the backend running locally
// (`uv run uvicorn src.main:app --port 8000`), which allows localhost origins.
const LOCAL_WEB_BASE_URL = 'http://localhost:8000';

const TIMEOUT_MS = 30_000;

let baseUrl = Platform.OS === 'web' && __DEV__ ? LOCAL_WEB_BASE_URL : DEFAULT_BASE_URL;
let accessCode = '';
let deviceId = '';
let adminCode = '';

export function setBaseUrl(url: string) {
  baseUrl = url.replace(/\/+$/, '');
}

export function setAccessCode(code: string) {
  accessCode = code;
}

// Sent with every request (X-Device-ID) so usage limits apply per install
export function setDeviceId(id: string) {
  deviceId = id;
}

// Sent as X-Admin-Code only while admin is unlocked; pass '' to clear
export function setAdminCode(code: string) {
  adminCode = code;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  // Overrides the stored admin code for this one request (used to verify a candidate code)
  adminCode?: string;
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessCode) headers['X-Code'] = accessCode;
  if (deviceId) headers['X-Device-ID'] = deviceId;
  const admin = options.adminCode ?? adminCode;
  if (admin) headers['X-Admin-Code'] = admin;

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
  // Admin endpoints need X-Admin-Code; errors: 401 wrong code, 429 too many attempts, 503 not configured.
  // Pass `code` to try a candidate code without storing it first.
  getAdminSettings: (code?: string) =>
    request<AdminSettings>('GET', 'api/admin/settings', undefined, { adminCode: code }),
  saveAdminSettings: (patch: AdminSettingsPatch) =>
    request<AdminSettings>('POST', 'api/admin/settings', patch),
  getAdminUsage: () => request<AdminUsage>('GET', 'api/admin/usage'),
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
  analyzeScenario: (req: AnalyzeScenarioRequest) =>
    request<AnalyzeScenarioResponse>('POST', 'api/analyze-scenario', req),
};

// Checks a candidate admin code against the server without storing it; resolves with the settings.
export const verifyAdminCode = (code: string) => api.getAdminSettings(code);
