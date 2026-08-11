import os
import json
import re
from typing import List, Dict, Optional
from langchain_core.messages import HumanMessage
from src.agent import get_llm, clean_json_response

MISINTERPRET_SYSTEM_PROMPT = """You are a master texting coach specialized in playful banter and flirting.
Your task is to take a partner's message and generate 3 creative, witty, or flirty "deliberate misinterpretations".

If the partner's message is empty, blank, or says "random", you must first pick or generate a common, realistic partner texting message (e.g., "I'm going to sleep now," "I'm heading to the gym," "I just bought pizza," "I had a busy day today"). Return this selected partner message in the "partner_text" field of the JSON. Otherwise, return the exact user input in "partner_text".

Deliberate misinterpretation is a texting technique where you intentionally "misread" what they said in a playful, cocky, or teasing way to create spark and humor.

Generate exactly 3 options corresponding to these styles:
1. "Charming/Flirty": Misinterpreting their text as them being obsessed with you or proposing something romantic (e.g. they say "I'm going to the gym" -> "Trying to get fit for our first date? I respect the hustle.").
2. "Absurd/Teasing": Taking their text literally to a ridiculous extreme or tease them (e.g. they say "I went to bed early" -> "At 9 PM? Are you secretly a grandpa?").
3. "Cocky/Reversed": Reversing the dynamic so they look like they are chasing you or trying to make excuses (e.g. they say "I've been busy" -> "I know, talking to me is intimidating, take your time.").

Texting Style Guidelines:
- Keep the options extremely short, casual, and texting-friendly (lowercase where appropriate, brief, typically under 6-10 words).
- Standard English ONLY. Zero Hindi or Hinglish.
- Tease them playfully without being mean or insulting.

You must return a valid JSON object matching this schema:
{{
  "partner_text": "The partner text that is being misinterpreted (re-use the input, or insert the generated random one if the input was empty/random)",
  "misinterpretations": [
    {{
      "style": "Charming/Flirty",
      "text": "The flirty misinterpretation text",
      "explanation": "Why this works (1 sentence)."
    }},
    {{
      "style": "Absurd/Teasing",
      "text": "The teasing misinterpretation text",
      "explanation": "Why this works (1 sentence)."
    }},
    {{
      "style": "Cocky/Reversed",
      "text": "The cocky misinterpretation text",
      "explanation": "Why this works (1 sentence)."
    }}
  ]
}}

Do not include any markdown format blocks, just output raw JSON."""

import random

RANDOM_PARTNER_TEXTS = [
    "I'm going to the gym now.",
    "I just got some sushi.",
    "I had a really busy day today, barely had time to eat.",
    "I'm going to bed early tonight, so tired.",
    "My phone was on silent, sorry!",
    "I'm hanging out with my friends right now.",
    "I don't really like coffee.",
    "I'm watching a horror movie.",
    "I just got a new puppy!",
    "I'm stuck in traffic, going to be late.",
    "I think I lost my keys.",
    "I'm reading a really good mystery novel.",
    "I hate cold weather.",
    "I have to work this weekend.",
    "I just finished a 5k run."
]

def generate_misinterpretations_agent(
    partner_text: str,
    model_name: Optional[str] = None
) -> Dict:
    # If empty or says 'random', choose a random texting line from our collection
    cleaned_input = partner_text.strip().lower() if partner_text else ""
    if not cleaned_input or cleaned_input == "random":
        partner_text = random.choice(RANDOM_PARTNER_TEXTS)
        
    llm = get_llm(json_mode=True, model_name=model_name)
    
    prompt = f"Partner says: \"{partner_text}\""
    message = HumanMessage(content=[
        {"type": "text", "text": MISINTERPRET_SYSTEM_PROMPT},
        {"type": "text", "text": prompt}
    ])
    
    response = llm.invoke([message])
    result = clean_json_response(response.content)
    # Ensure partner_text is returned correctly
    result["partner_text"] = partner_text
    return result
