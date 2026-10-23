// Request/response shapes, ported from android/app/.../data/model/DataModels.kt.
// Field names match the backend (src/schemas.py) exactly.

export type PartnerPersona = 'normal' | 'intermediate' | 'extraordinary';

export interface MessageModel {
  sender: string;
  body: string;
  timestamp?: string;
}

export interface SendMessageRequest {
  context: string;
  scenario: string;
  chat_history: MessageModel[];
  message: string;
  partner_persona?: PartnerPersona;
}

export interface SendMessageResponse {
  reply: string;
}

export interface ImproveMessageRequest {
  context: string;
  scenario: string;
  chat_history: MessageModel[];
  message_to_improve: string;
}

export interface ImproveMessageResponse {
  alternatives: string[];
}

export interface VibeReviewRequest {
  context: string;
  scenario: string;
  chat_history: MessageModel[];
}

export interface VibeReviewItem {
  original_message: string;
  improved_message: string;
  explanation: string;
}

export interface VibeReviewResponse {
  overall_feedback: string;
  score: number;
  comparisons: VibeReviewItem[];
}

export interface InitiateChatRequest {
  user_first_input: string;
  partner_persona?: PartnerPersona;
}

export interface InitiateChatResponse {
  context: string;
  scenario: string;
  cleaned_user_message: string;
  partner_reply: string;
}

export interface OpenerItem {
  text: string;
  vibe: string;
  explanation: string;
}

export interface GetOpenersRequest {
  scenario_text: string;
  image_base64?: string | null;
}

export interface GetOpenersResponse {
  openers: OpenerItem[];
}

export interface MisinterpretItem {
  style: string;
  text: string;
  explanation: string;
}

export interface MisinterpretRequest {
  partner_text: string;
}

export interface MisinterpretResponse {
  partner_text: string;
  misinterpretations: MisinterpretItem[];
}

export type ConversationSetting = 'online' | 'in_person';
export type ConversationStarter = 'me' | 'other';
export type PersonalityKey = 'sarcastic' | 'flirty' | 'cocky' | 'dry' | 'nerdy';

export interface BanterRequest {
  topic?: string | null;
  num_turns?: number;
  persona_a_name?: string;
  persona_a_style?: string | null;
  persona_b_name?: string;
  persona_b_style?: string | null;
  chat_history?: MessageModel[] | null;
  setting?: ConversationSetting;
  starter?: ConversationStarter;
}

export interface BanterExchange {
  speaker: string;
  text: string;
}

export interface BanterResponse {
  topic: string;
  persona_a: string;
  persona_b: string;
  exchanges: BanterExchange[];
}

// GET api/config is a connection check only
export interface ConfigResponse {
  status: string;
}

// Admin-only settings, changed at runtime on the server (GET/POST api/admin/settings)
export interface AdminSettings {
  default_model: string;
  available_models: string[];
  device_daily_limit: number;
  ip_daily_limit: number;
  global_daily_limit: number;
  your_device_id: string | null; // this install's id, for ADMIN_DEVICE_IDS on the server
  device_locked: boolean; // true when admin only works from listed device ids
}

export type AdminSettingsPatch = Partial<
  Pick<AdminSettings, 'default_model' | 'device_daily_limit' | 'ip_daily_limit' | 'global_daily_limit'>
>;

export interface UsageRow {
  id: string;
  tokens: number;
  requests: number;
}

// Today's usage (GET api/admin/usage)
export interface AdminUsage {
  usage_date: string;
  global_tokens: number;
  global_requests: number;
  global_limit: number;
  device_limit: number;
  ip_limit: number;
  devices: UsageRow[];
  ips: UsageRow[];
  model: string;
  provider_daily_requests: number | null; // Google's requests/day cap for the model, null if unknown
  history: { date: string; tokens: number; requests: number }[]; // most recent days first
  all_time_tokens: number;
  all_time_requests: number;
  admin_tokens: number; // the owner's own usage today
  admin_requests: number;
  admin_all_time_tokens: number;
  admin_all_time_requests: number;
}

export interface GenerateScenarioRequest {
  category?: string | null;
  previous_scenario?: string | null;
}

export interface GenerateScenarioResponse {
  scenario: string;
}

export interface AnalyzeScenarioRequest {
  scenario: string;
}

export interface AnalyzeScenarioResponse {
  me_name: string;
  other_name: string;
  starter: ConversationStarter;
  setting: ConversationSetting;
  me_personality: PersonalityKey;
  other_personality: PersonalityKey;
}
