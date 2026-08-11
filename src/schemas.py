from pydantic import BaseModel
from typing import List, Optional

class MessageModel(BaseModel):
    sender: str
    body: str
    timestamp: Optional[str] = ""

class StartChatRequest(BaseModel):
    context: str

class StartChatResponse(BaseModel):
    scenario: str
    first_message: str

class SendMessageRequest(BaseModel):
    context: str
    scenario: str
    chat_history: List[MessageModel]
    message: str

class SendMessageResponse(BaseModel):
    reply: str

class ConfigRequest(BaseModel):
    model_name: Optional[str] = "gemini-2.5-flash"

class ImproveMessageRequest(BaseModel):
    context: str
    scenario: str
    chat_history: List[MessageModel]
    message_to_improve: str

class VibeReviewRequest(BaseModel):
    context: str
    scenario: str
    chat_history: List[MessageModel]

class VibeReviewItem(BaseModel):
    original_message: str
    improved_message: str
    explanation: str

class VibeReviewResponse(BaseModel):
    overall_feedback: str
    score: int
    comparisons: List[VibeReviewItem]

class InitiateChatRequest(BaseModel):
    user_first_input: str

class InitiateChatResponse(BaseModel):
    context: str
    scenario: str
    cleaned_user_message: str
    partner_reply: str

class OpenerItem(BaseModel):
    text: str
    vibe: str
    explanation: str

class GetOpenersRequest(BaseModel):
    scenario_text: str
    image_base64: Optional[str] = None

class GetOpenersResponse(BaseModel):
    openers: List[OpenerItem]

class MisinterpretItem(BaseModel):
    style: str
    text: str
    explanation: str

class MisinterpretRequest(BaseModel):
    partner_text: str

class MisinterpretResponse(BaseModel):
    partner_text: str
    misinterpretations: List[MisinterpretItem]

class BanterRequest(BaseModel):
    topic: Optional[str] = None
    num_turns: Optional[int] = 8

class BanterExchange(BaseModel):
    speaker: str
    text: str

class BanterResponse(BaseModel):
    topic: str
    persona_a: str
    persona_b: str
    exchanges: List[BanterExchange]






