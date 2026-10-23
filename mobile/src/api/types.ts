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

export interface BanterRequest {
  topic?: string | null;
  num_turns?: number;
  persona_a_name?: string;
  persona_a_style?: string | null;
  persona_b_name?: string;
  persona_b_style?: string | null;
  chat_history?: MessageModel[] | null;
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

export interface ConfigResponse {
  has_key: boolean;
  model_name: string;
}

export interface ConfigSaveRequest {
  model_name: string;
}

export interface GenerateScenarioRequest {
  category?: string | null;
  previous_scenario?: string | null;
}

export interface GenerateScenarioResponse {
  scenario: string;
}
