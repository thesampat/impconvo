import os
import json
import re
from typing import List, Dict, Optional
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from src.agent import get_llm, clean_json_response

OPENER_SYSTEM_PROMPT = """You are a master social and dating coach.
Your task is to analyze the provided text scenario and/or profile screenshot, and generate 8 creative, high-engagement opening lines.

You must adapt the opening lines to the medium:
- In-Person Approach: If the user describes a real-life physical setting (e.g., coffee shop, gym, bookstore, street encounter, library), generate low-pressure, natural verbal openers that can be spoken out loud.
- Online Approach: If the user describes an online match setting (e.g., Hinge profile, Instagram DMs, Tinder bio details), generate brief, typing-friendly text openers.

Generate exactly 8 options, each corresponding to one of these distinct vibes:
1. "Natural": Casual, friendly, low-pressure, and conversational.
2. "Flirty": Playful, direct, charming, and showing interest.
3. "Exaggeration": Playfully blowing a detail, hobby, or prompt out of proportion.
4. "Deadpan": Dry, sarcastic, matter-of-fact, or amusingly blunt.
5. "Roleplay": Setting up a fun, imaginary scenario or alliance.
6. "Self-Deprecating": Self-aware, humble, light self-joke.
7. "Cocky/Teasing": Playfully challenging them or teasing a profile cue/observation.
8. "Absurd": A totally unexpected, bizarre, or creative observation or question.

Guidelines for Openers:
- They must be written in standard English ONLY. Absolutely no Hindi or Hinglish.
- Keep them realistic and texting-friendly (lowercase where appropriate, brief, typically under 12-15 words, and easy to respond to).
- Do not write generic or boring openers like "Hey how are you". They must be customized to the profile image or text scenario details provided.
- If there is an image, analyze their profile tags, photo settings, bio text, or prompts to extract unique hooks.

You must return a valid JSON object matching this schema:
{{
  "openers": [
    {{
      "vibe": "Natural",
      "text": "The custom natural opener",
      "explanation": "Why this works (1 sentence)."
    }},
    {{
      "vibe": "Flirty",
      "text": "The custom flirty opener",
      "explanation": "Why this works (1 sentence)."
    }},
    {{
      "vibe": "Exaggeration",
      "text": "The custom exaggeration opener",
      "explanation": "Why this works (1 sentence)."
    }},
    {{
      "vibe": "Deadpan",
      "text": "The custom deadpan opener",
      "explanation": "Why this works (1 sentence)."
    }},
    {{
      "vibe": "Roleplay",
      "text": "The custom roleplay opener",
      "explanation": "Why this works (1 sentence)."
    }},
    {{
      "vibe": "Self-Deprecating",
      "text": "The custom self-deprecating opener",
      "explanation": "Why this works (1 sentence)."
    }},
    {{
      "vibe": "Cocky/Teasing",
      "text": "The custom cocky/teasing opener",
      "explanation": "Why this works (1 sentence)."
    }},
    {{
      "vibe": "Absurd",
      "text": "The custom absurd opener",
      "explanation": "Why this works (1 sentence)."
    }}
  ]
}}

Do not include any markdown format blocks, just output raw JSON."""

def generate_openers_agent(
    scenario_text: str,
    image_base64: Optional[str] = None,
    model_name: Optional[str] = None
) -> Dict:
    # Use Gemini model with json mode enabled
    llm = get_llm(json_mode=True, model_name=model_name)
    
    # Standardize image base64 if present
    content_parts = []
    
    # System prompt
    content_parts.append({"type": "text", "text": OPENER_SYSTEM_PROMPT})
    
    # Scenario prompt
    user_prompt = f"User Scenario description / background: {scenario_text}"
    content_parts.append({"type": "text", "text": user_prompt})
    
    if image_base64:
        # Check if it has a prefix
        if not image_base64.startswith("data:image"):
            # Assume it is a jpeg if raw base64
            image_base64 = f"data:image/jpeg;base64,{image_base64}"
            
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": image_base64}
        })
        
    # Standard human message structure
    message = HumanMessage(content=content_parts)
    
    # Run the model
    response = llm.invoke([message])
    
    # Parse and clean response
    return clean_json_response(response.content)
