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


def generate_banter_agent(
    topic: Optional[str] = None,
    num_turns: int = 8,
    model_name: Optional[str] = None
) -> Dict:
    # Pick a random topic if none provided
    if not topic:
        topic = random.choice(TOPICS)

    persona_a = PERSONAS[0]
    persona_b = PERSONAS[1]

    system_prompt = BANTER_SYSTEM_PROMPT.format(
        name_a=persona_a["name"],
        name_b=persona_b["name"],
        style_a=persona_a["style"],
        style_b=persona_b["style"],
        topic=topic,
        num_turns=num_turns
    )

    llm = get_llm(json_mode=True, model_name=model_name)
    message = HumanMessage(content=[
        {"type": "text", "text": system_prompt},
        {"type": "text", "text": "Begin the banter now."}
    ])

    response = llm.invoke([message])
    result = clean_json_response(response.content)
    result["persona_a"] = persona_a["name"]
    result["persona_b"] = persona_b["name"]
    return result
