import os
import json
import random
from typing import List, Dict, Optional
from langchain_core.messages import HumanMessage
from src.agent import get_llm, clean_json_response

# The two personas battling each other
PERSONAS = [
    {
        "name": "Alex",
        "style": "cocky, witty, and a little too confident. Loves teasing with self-assurance."
    },
    {
        "name": "Jordan",
        "style": "sarcastic, clever, and dry-humored. Never lets Alex get away with anything."
    }
]

TOPICS = [
    "who makes better coffee",
    "who is harder to get",
    "who takes longer to reply and why",
    "who is actually funnier",
    "who is more mysterious",
    "who texts first and what that means",
    "who has the better music taste",
    "who would survive a zombie apocalypse longer",
    "who is a better cook",
    "who dresses better",
]

BANTER_SYSTEM_PROMPT = """You are writing a fun, short banter script between two people: {name_a} and {name_b}.

{name_a}'s personality: {style_a}
{name_b}'s personality: {style_b}

They are bantering about: {topic}

Rules:
- Generate exactly {num_turns} exchanges (alternating: {name_a} first, then {name_b}, etc).
- Each line must be SHORT (under 12 words), punchy, and natural-sounding — like real witty texting.
- Use a mix of flirting, teasing, self-deprecating jokes, cocky reversals, absurd comparisons, and misinterpretation.
- Do NOT use emojis.
- Make it escalate in wit and playfulness as it goes.
- Standard English ONLY.

Return a valid JSON object like this:
{{
  "topic": "{topic}",
  "exchanges": [
    {{"speaker": "{name_a}", "text": "..."}},
    {{"speaker": "{name_b}", "text": "..."}},
    ...
  ]
}}

No markdown. Raw JSON only."""


from src.usage_tracker import record_user_usage, extract_tokens_from_llm_response

def generate_banter_agent(
    topic: Optional[str] = None,
    num_turns: int = 8,
    persona_a_name: Optional[str] = None,
    persona_a_style: Optional[str] = None,
    persona_b_name: Optional[str] = None,
    persona_b_style: Optional[str] = None,
    chat_history: Optional[List[Dict]] = None,
    model_name: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict:
    # Pick a random topic if none provided
    if not topic:
        topic = random.choice(TOPICS)

    name_a = (persona_a_name or "Alex").strip()
    name_b = (persona_b_name or "Jordan").strip()
    style_a = (persona_a_style or PERSONAS[0]["style"]).strip()
    style_b = (persona_b_style or PERSONAS[1]["style"]).strip()

    history_context = ""
    next_speaker = name_a
    if chat_history and len(chat_history) > 0:
        lines = []
        for msg in chat_history:
            sender = msg.get("sender") or msg.get("speaker") or "Speaker"
            body = msg.get("body") or msg.get("text") or ""
            lines.append(f"[{sender}]: {body}")
        history_context = "\nPrevious chat transcript so far:\n" + "\n".join(lines) + "\n\nContinue the banter seamlessly from this point without repeating previous lines."
        # Determine who should speak next
        last_sender = (chat_history[-1].get("sender") or chat_history[-1].get("speaker") or "").strip()
        if last_sender.lower() == name_a.lower():
            next_speaker = name_b
        else:
            next_speaker = name_a

    system_prompt = f"""You are writing a fun, witty, realistic texting banter dialogue between two people: {name_a} and {name_b}.

{name_a}'s personality: {style_a}
{name_b}'s personality: {style_b}

They are bantering about: {topic}
{history_context}

Rules:
- Generate exactly {num_turns} exchanges (alternating turns starting with {next_speaker}).
- Each line must be SHORT (under 15 words), punchy, and natural-sounding — like real witty texting.
- Use a mix of playful teasing, cheeky callbacks, self-deprecating humor, and cocky reversals.
- Do NOT use emojis.
- Standard English ONLY.
- Return a valid JSON object like this:
{{
  "topic": "{topic}",
  "exchanges": [
    {{"speaker": "{name_a}", "text": "..."}},
    {{"speaker": "{name_b}", "text": "..."}}
  ]
}}
No markdown formatting. Raw JSON only."""

    llm = get_llm(json_mode=True, model_name=model_name, temperature=0.9)
    message = HumanMessage(content=[
        {"type": "text", "text": system_prompt},
        {"type": "text", "text": f"Begin the banter exchanges now starting with {next_speaker}."}
    ])

    try:
        response = llm.invoke([message])
        if user_id:
            tokens = extract_tokens_from_llm_response(response, fallback_text=topic)
            record_user_usage(user_id, tokens)

        result = clean_json_response(response.content)
        result["persona_a"] = name_a
        result["persona_b"] = name_b
        if "exchanges" not in result or not isinstance(result["exchanges"], list):
            result["exchanges"] = []
        return result
    except Exception as e:
        print(f"Error generating banter: {e}", flush=True)
        return {
            "topic": topic,
            "persona_a": name_a,
            "persona_b": name_b,
            "exchanges": [
                {"speaker": name_a, "text": f"So we're really doing this debate about {topic}?"},
                {"speaker": name_b, "text": "Only because I know I'm going to win in two seconds."},
                {"speaker": name_a, "text": "Keep dreaming. You haven't won an argument since 2018."},
                {"speaker": name_b, "text": "That's because you weren't smart enough to notice I won."}
            ]
        }


