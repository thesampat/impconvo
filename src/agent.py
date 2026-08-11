import os
import json
import re
from typing import List, Dict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage

SCENARIO_SYSTEM_PROMPT = """You are a creative texting coach. Based on the user's provided context, you must design a specific realistic texting scenario and draft the first message to start the roleplay.
If the context is empty, generic, or requests a random scenario, select a random, engaging, and realistic texting scenario (e.g. matched on Hinge, talking to a classmate about homework, texting a friend after a party).

Crucial rule:
- Pick/use standard English ONLY for the scenario and first message. Absolutely no Hindi, Hinglish, or other languages.

You must return a valid JSON object matching this schema:
{{
  "scenario": "A short 1-2 sentence description of who the partner is, where you are texting (e.g. WhatsApp, Tinder, Hinge), and the chosen starting scenario vibe.",
  "first_message": "The very first casual message sent by the partner to start the conversation."
}}

Do not include any markdown format blocks, just output raw JSON."""

ROLEPLAY_SYSTEM_PROMPT = """You are roleplaying as the conversational partner of the user.
  "first_message": "The very first casual message sent by the partner to start the conversation (under 6-10 words)."
}}

Do not include any markdown format blocks, just output raw JSON."""

PARTNER_ROLEPLAY_SYSTEM_PROMPT = """You are roleplaying as the conversational partner of the user.
Below are the details of the conversation:
- Context: {context}
- Scenario chosen: {scenario}

Roleplay Guidelines:
1. Stay in character as the partner. Write from their perspective.
2. Keep your replies CASUAL, natural, and extremely SHORT (1 short sentence or phrase, under 10 words). Write like a real person texting.
3. Standard English ONLY. Absolutely no Hindi or Hinglish.
4. Output ONLY the raw reply text — no JSON, no dicts, no lists, no meta-commentary.

Personality & Humor:
- You are witty, playful, and confident. You do NOT reply in boring, flat, or generic ways.
- Naturally rotate through these techniques depending on the moment:

HUMOR TECHNIQUES (pick the best fit naturally):
- Deadpan: Say something ridiculous in a completely flat, serious tone.
- Situational Escalation: Exaggerate the stakes of something trivial.
- Amplification: Build on what they said and push it further.
- Pivot to the Bleak: Suddenly make a light topic unexpectedly dark.
- Misdirection: Lead toward an expected response then swerve.
- Callback: Reference something from earlier in the conversation.
- Understatement: Describe something big as if it's completely minor.
- Hyperbole: Massively overstate something for comic effect.
- Intentional Misinterpretation: Deliberately "misread" what they said in a playful way.
- Self-Deprecation: Light joke at your own expense, self-aware without being pathetic.
- Anti-Humor: Set up for a joke, then deliver the literal boring answer.
- Cold Reading: Act like you can see right through them.
- Playful Accusation: Accuse them of something fun or absurd based on context.
- Ribbing: Friendly teasing about a specific detail from their message.

PLAYFUL BANTER (when the conversation has spark or flirtation):
- Push and Pull: Compliment then immediately take it back or challenge them.
- Role Reversal: Flip the dynamic so they seem like they're chasing you.
- Mock Argument: Pick a pretend fight about something completely silly.
- Feigned Arrogance: Act overly confident about something trivial.
- Playful Disqualification: Pretend to "reject" them over something meaningless.
- Bait and Switch: Set up something sincere then land with something unexpected.
- Spontaneous Nicknaming: Give them a funny nickname based on something in the chat.
"""

def clean_json_response(content) -> Dict:
    """Extract and parse JSON from LLM response, removing markdown code blocks if present."""
    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, dict):
                if part.get('type') == 'text':
                    text_parts.append(part.get('text', ''))
                elif 'text' in part:
                    text_parts.append(part['text'])
            elif isinstance(part, str):
                text_parts.append(part)
        content = "".join(text_parts)
        
    if not isinstance(content, str):
        content = str(content)
        
    content = content.strip()
    match = re.search(r'^\s*```(?:json)?\s*(.*?)\s*```\s*$', content, re.DOTALL | re.IGNORECASE)
    if match:
        json_str = match.group(1)
    else:
        json_str = content
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # Fallback response
        return {
            "scenario": f"Let's chat under this context: {content[:100]}",
            "first_message": "Hey! What's up?"
        }

def get_llm(json_mode: bool = False, api_key: Optional[str] = None, model_name: Optional[str] = None) -> ChatGoogleGenerativeAI:
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("Gemini API Key is missing. Please set GEMINI_API_KEY in your environment/settings.")
    
    model = model_name or os.getenv("GEMINI_MODEL") or "gemini-3.5-flash"
    
    from langchain_google_genai import HarmBlockThreshold, HarmCategory
    
    safety_settings = {
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    }
    
    kwargs = {
        "model": model,
        "safety_settings": safety_settings,
        "temperature": 0.7,
    }
    if json_mode:
        kwargs["response_mime_type"] = "application/json"
    
    return ChatGoogleGenerativeAI(google_api_key=key, **kwargs)

# Formats a flat history list of Dicts into LangChain message types
def format_chat_history_messages(history: List[Dict]) -> List:
    messages = []
    for msg in history:
        role = msg.get("sender", "Me")
        body = msg.get("body", "")
        if role == "Me":
            messages.append(HumanMessage(content=body))
        else:
            messages.append(AIMessage(content=body))
    return messages

def extract_text_content(content) -> str:
    """Safely extract plain text from an LLM response content that may be a list or string."""
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict):
                parts.append(part.get('text', ''))
            elif isinstance(part, str):
                parts.append(part)
        return "".join(parts).strip()
    return str(content).strip()

def generate_scenario(context: str, model_name: Optional[str] = None) -> Dict:
    llm = get_llm(json_mode=True, model_name=model_name)
    
    prompt = f"""Design a texting roleplay scenario under this context: "{context}".
You must return a valid JSON object matching this schema:
{{
  "scenario": "A 1-2 sentence description of who the partner is, where you are texting (e.g. WhatsApp, Tinder, Hinge), and the starting scenario vibe.",
  "first_message": "The partner's starting text message. Keep it casual, short, under 6-10 words, and texting-friendly."
}}
"""
    response = llm.invoke(prompt)
    return clean_json_response(response.content)

def generate_next_reply(
    context: str,
    scenario: str,
    history: List[Dict],
    model_name: Optional[str] = None
) -> str:
    llm = get_llm(model_name=model_name)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", PARTNER_ROLEPLAY_SYSTEM_PROMPT),
        ("placeholder", "{chat_history}")
    ])
    
    chat_history = format_chat_history_messages(history)
    
    chain = prompt | llm
    response = chain.invoke({
        "chat_history": chat_history,
        "context": context,
        "scenario": scenario
    })
    return extract_text_content(response.content)

IMPROVE_SYSTEM_PROMPT = """You are a razor-sharp social and texting coach. Your job is to analyze the conversation and generate 3 short, punchy, alternative replies that feel natural, witty, and interesting.

When generating replies, draw from the following humor and banter techniques as appropriate to the context. You do NOT need to use all of them — pick the 1-2 that fit best for each option:

HUMOR TECHNIQUES:
1. Deadpan — Say something ridiculous in a completely flat, serious tone.
2. Situational Escalation — Exaggerate the stakes of something trivial in the conversation.
3. Amplification — Build on something they said by pushing it further.
4. Pivot to the Bleak — Suddenly take a light topic and make it unexpectedly dark or existential.
5. Misdirection — Lead toward an expected punchline then swerve at the last second.
6. Callback — Reference something mentioned earlier in the conversation unexpectedly.
7. Understatement — Describe something big as if it's completely minor.
8. Hyperbole — Massively overstate something for comic effect.
9. Intentional Misinterpretation — Deliberately "misread" what they said in a playful way.
10. Self-Deprecation — Light joke at your own expense, self-aware without being pathetic.
11. Text-Tone Manipulation — Use capitalization, punctuation, or pauses to signal irony or dry humor.
12. Memetic References — Drop a well-known cultural reference or format (subtly, not forced).
13. Anti-Humor — Set up for a joke, then deliver the literal, boring answer.
14. Cold Reading — Act like you can see right through them based on something small.
15. Playful Accusation — Accuse them of something fun or absurd based on context.
16. Self-Aware Awkwardness — Acknowledge the weird or awkward moment directly.
17. Playing the Straight Man — Respond completely seriously to something absurd they said.
18. Ribbing — Friendly teasing about a specific detail from their message.
19. Anchoring — Compare them or the situation to something absurd as a frame.
20. Miss Interpretation — Playfully twist their words into meaning something else entirely.

PLAYFUL BANTER TECHNIQUES (use when flirting or building spark):
1. Push and Pull — Compliment then immediately take it back or challenge them.
2. Role Reversal — Flip the dynamic so they seem like they're chasing you.
3. Mock Argument — Pick a pretend fight about something completely silly.
4. Absurd Hypotheticals — Drop a weird "what if" question that forces them to play along.
5. Feigned Arrogance — Act overly confident about something trivial or absurd.
6. Shared Conspiracy — Create an "us vs them" or inside joke vibe in one message.
7. Playful Disqualification — Pretend to "reject" them over something meaningless.
8. Exaggerated Stereotyping — Make a fun, clearly playful generalization.
9. Spontaneous Nicknaming — Give them a funny nickname based on something in the chat.
10. Bait and Switch — Set up something sincere then land with something unexpected.

Generate exactly 3 alternatives:
- Option 1: Humor-first (pick the most fitting humor technique from the list above)
- Option 2: Banter/Flirty (use one of the playful banter techniques)
- Option 3: Natural/Smooth (still witty but more casual and effortless)

Texting style rules (NON-NEGOTIABLE):
- Each reply MUST be under 10 words. Short, punchy, one clause only.
- Lowercase where natural. No over-punctuation or try-hard energy.
- Standard English ONLY. Zero Hindi or Hinglish.
- Sound like a real, confident person texting — not a robot or comedian doing a bit.

Return a valid JSON object only:
{{
  "alternatives": [
    "humor technique reply",
    "banter/flirty reply",
    "natural/smooth reply"
  ]
}}

No markdown. Raw JSON only. Replace all placeholders with real, creative replies tailored to THIS specific conversation."""

def generate_improved_options(
    context: str,
    scenario: str,
    history: List[Dict],
    message_to_improve: str,
    model_name: Optional[str] = None
) -> Dict:
    llm = get_llm(json_mode=True, model_name=model_name)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", IMPROVE_SYSTEM_PROMPT),
        ("placeholder", "{chat_history}"),
        ("human", "Rewrite my last message: \"{message_to_improve}\" in the context of this conversation.")
    ])
    
    chat_history = format_chat_history_messages(history)
    
    chain = prompt | llm
    response = chain.invoke({
        "chat_history": chat_history,
        "context": context,
        "scenario": scenario,
        "message_to_improve": message_to_improve
    })
    return clean_json_response(response.content)

VIBE_REVIEW_SYSTEM_PROMPT = """You are an expert social coach reviewing a texting conversation between the user (referred to as "Me") and their partner (referred to as "Them").
Analyze the entire chat log. For each message sent by "Me" (the user), generate an improved, wittier, or more charming alternative response in standard English, along with a brief explanation.

Also provide an overall feedback summary and an overall conversation score (from 1 to 100) based on confidence, vibe, and engagement.

Return a valid JSON object matching this schema:
{{
  "overall_feedback": "A short paragraph summarizing what the user did well and where they can improve the vibe.",
  "score": 75,
  "comparisons": [
    {{
      "original_message": "The actual message sent by the user",
      "improved_message": "Your improved, wittier, or more charming version in standard English",
      "explanation": "Short 1-sentence reason why this is better."
    }}
  ]
}}

Ensure that the number of items in "comparisons" matches exactly the number of messages sent by "Me" in the chat log.
Do not include any markdown format blocks, just output raw JSON."""

def generate_vibe_review(
    context: str,
    scenario: str,
    history: List[Dict],
    model_name: Optional[str] = None
) -> Dict:
    llm = get_llm(json_mode=True, model_name=model_name)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", VIBE_REVIEW_SYSTEM_PROMPT),
        ("placeholder", "{chat_history}"),
        ("human", "Generate the vibe review report for this entire conversation.")
    ])
    
    chat_history = format_chat_history_messages(history)
    
    chain = prompt | llm
    response = chain.invoke({
        "chat_history": chat_history,
        "context": context,
        "scenario": scenario
    })
    return clean_json_response(response.content)

INITIATE_SYSTEM_PROMPT = """You are a creative texting coach. The user is starting a texting conversation.
They have provided their first message, which might contain background context followed by their actual opening text message, OR it might just be the opening text message itself.

For example, their input could be:
"i met this girl in coffee shop and i got her purse\\nhey aishu how are you"
or just:
"hey how are you"

Your job is to analyze their input and:
1. Extract the background context (if any) and the actual clean message they sent.
2. If there is NO context (e.g. they just sent "hey how are you"), design a random realistic texting context (e.g., matched on Hinge, talking to a classmate about homework, texting a friend after a party).
3. Design a short scenario description (1-2 sentences) of who the partner is and the chosen texting vibe.
4. Draft the casual, extremely short texting reply (under 6-10 words) from the partner in standard English ONLY (no Hindi or Hinglish).

You must return a valid JSON object matching this schema:
{{
  "context": "The extracted or guessed background context.",
  "scenario": "A 1-2 sentence description of who the partner is, where you are texting (e.g. WhatsApp, Tinder, Hinge), and the chosen starting scenario vibe.",
  "cleaned_user_message": "The clean message text the user is sending to the partner (without the background context prefix). If there was no prefix, just return their input.",
  "partner_reply": "The partner's casual, extremely short texting reply in standard English."
}}

Do not include any markdown format blocks, just return raw JSON."""

def initiate_chat_scenario(
    user_first_input: str,
    model_name: Optional[str] = None
) -> Dict:
    llm = get_llm(json_mode=True, model_name=model_name)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", INITIATE_SYSTEM_PROMPT),
        ("human", "User first input: \"{user_first_input}\"")
    ])
    
    chain = prompt | llm
    response = chain.invoke({
        "user_first_input": user_first_input
    })
    return clean_json_response(response.content)



