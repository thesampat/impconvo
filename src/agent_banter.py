import os
import json
import random
from typing import List, Dict, Optional
from langchain_core.messages import HumanMessage
from src.agent import get_llm, clean_json_response, extract_text_content


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
    setting: Optional[str] = "online",
    starter: Optional[str] = None,
    model_name: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict:
    in_person = (setting or "").strip().lower() in ("in_person", "in-person", "real", "offline")
    if in_person:
        medium = "a face-to-face, in-person conversation"
        line_style = "like real people talking out loud in person (spoken dialogue, no references to texting or phones)"
    else:
        medium = "a texting conversation"
        line_style = "like real witty texting"

    # If no scenario provided, use Gemini to dynamically generate one
    if not topic or not str(topic).strip():
        topic_llm = get_llm(model_name=model_name, temperature=0.9)
        topic_res = topic_llm.invoke("Give a single short, realistic social scenario where one person starts a conversation with another (e.g. approaching someone at a cafe, or matched on Hinge). Output ONLY the scenario, under 10 words, no quotes.")
        topic = extract_text_content(topic_res.content).strip().strip('"').strip("'")

    name_a = (persona_a_name or "Alex").strip()
    name_b = (persona_b_name or "Jordan").strip()
    style_a = (persona_a_style or "cocky, witty, and a little too confident. Loves teasing with self-assurance.").strip()
    style_b = (persona_b_style or "sarcastic, clever, and dry-humored. Never lets Alex get away with anything.").strip()


    history_context = ""
    next_speaker = None  # first turn: whoever the scenario says starts
    if chat_history and len(chat_history) > 0:
        lines = []
        for msg in chat_history:
            sender = msg.get("sender") or msg.get("speaker") or "Speaker"
            body = msg.get("body") or msg.get("text") or ""
            lines.append(f"[{sender}]: {body}")
        history_context = "\nPrevious chat transcript so far:\n" + "\n".join(lines) + "\n\nContinue the conversation seamlessly from this point without repeating previous lines."
        # Determine who should speak next
        last_sender = (chat_history[-1].get("sender") or chat_history[-1].get("speaker") or "").strip()
        if last_sender.lower() == name_a.lower():
            next_speaker = name_b
        else:
            next_speaker = name_a

    if not next_speaker and starter in ("me", "other"):
        next_speaker = name_a if starter == "me" else name_b

    if next_speaker:
        first_turn_rule = f"starting with {next_speaker}."
    else:
        first_turn_rule = (
            "starting with whoever initiates in the scenario (e.g. if someone approaches or asks "
            f"{name_a}, that person ({name_b}) speaks first; if {name_a} approaches or messages, {name_a} speaks first)."
        )

    system_prompt = f"""You are writing a realistic, witty conversation between two people: {name_a} and {name_b}.
The conversation happens as {medium}.

Scenario: {topic}

Roles:
- {name_a} and {name_b} are the two people IN this scenario, talking directly to each other.
- {name_a} is the user: whenever the scenario says "I", "me" or "my", that is {name_a}.
- {name_b} is the other person in the scenario (e.g. "a girl", "a stranger", "my match").
- Never write them as two onlookers or friends commenting on the scenario or on a third person.

{name_a}'s personality: {style_a}
{name_b}'s personality: {style_b}
{history_context}

Rules:
- Generate exactly {num_turns} exchanges, alternating turns, {first_turn_rule}
- Each line must be SHORT (under 15 words), punchy, and natural-sounding — {line_style}.
- Stay in character: each person responds the way a real person in that situation would.
- When starting a new conversation, the first line must be the literal, natural opening of the scenario, exactly what that person would really say first (e.g. "Excuse me, do you know how to get to 5th Street?" for someone asking directions). No joke, tease or flirting in the first line.
- Let the conversation build realistically from that exact starting point: the real purpose of the scenario (directions, the coffee, the match) stays the topic, and wit and banter grow out of it gradually.
- Use playful teasing, callbacks, light self-deprecation, and confident reversals where they fit.
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
        {"type": "text", "text": f"Begin the conversation now, {first_turn_rule}"}
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
        if not result["exchanges"]:
            raise ValueError("AI generated empty banter exchanges.")
        return result
    except Exception as e:
        print(f"Error generating banter: {e}", flush=True)
        raise RuntimeError(f"AI Banter generation failed: {e}")





ANALYZE_SCENARIO_PROMPT = """Read this social scenario written by a user and work out how the conversation is set up.
"I", "me" and "my" in the scenario mean the user.

Scenario: {scenario}

Decide:
- me_name: a realistic first name for the user. If the scenario does not hint at the user's gender, pick a gender-neutral name.
- other_name: a realistic first name for the other person that matches what the scenario says about them (e.g. "a girl" -> a female name, "a guy" -> a male name; gender-neutral if unclear).
- starter: "me" if the user speaks first (e.g. the user approaches or messages someone), or "other" if the other person speaks first (e.g. someone asks the user for directions).
- setting: "online" if they are texting or messaging (dating apps, DMs, chats), or "in_person" if they are talking face to face.
- me_personality and other_personality: the style that best fits how each person would realistically act in this scenario, chosen from exactly one of:
  "sarcastic" (sarcastic and witty), "flirty" (flirty and teasing), "cocky" (cocky and confident),
  "dry" (dry, reserved, a bit reluctant), "nerdy" (nerdy overthinker).
  For example, a stranger asking for directions is usually "dry"; someone confidently approaching a person they like is usually "cocky" or "flirty".

Return a valid JSON object only:
{{"me_name": "...", "other_name": "...", "starter": "me", "setting": "in_person", "me_personality": "cocky", "other_personality": "dry"}}
No markdown. Raw JSON only."""


def analyze_scenario_agent(
    scenario: str,
    model_name: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict:
    prompt = ANALYZE_SCENARIO_PROMPT.format(scenario=scenario.strip())
    llm = get_llm(json_mode=True, model_name=model_name, temperature=0.4)
    try:
        response = llm.invoke(prompt)
        if user_id:
            tokens = extract_tokens_from_llm_response(response, fallback_text=prompt)
            record_user_usage(user_id, tokens)
        result = clean_json_response(response.content)
    except Exception as e:
        print(f"Error analyzing scenario: {e}", flush=True)
        raise RuntimeError(f"AI scenario analysis failed: {e}")

    personalities = ("sarcastic", "flirty", "cocky", "dry", "nerdy")
    me_personality = str(result.get("me_personality", "")).strip().lower()
    other_personality = str(result.get("other_personality", "")).strip().lower()
    starter = str(result.get("starter", "")).strip().lower()
    setting = str(result.get("setting", "")).strip().lower().replace("-", "_")
    return {
        "me_name": str(result.get("me_name") or "Alex").strip(),
        "other_name": str(result.get("other_name") or "Jordan").strip(),
        "starter": starter if starter in ("me", "other") else "me",
        "setting": setting if setting in ("online", "in_person") else "online",
        "me_personality": me_personality if me_personality in personalities else "cocky",
        "other_personality": other_personality if other_personality in personalities else "sarcastic",
    }
