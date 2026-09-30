import os
import sys

# Ensure project root is in sys.path when running as a script (e.g. `python src/main.py`)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load env variables
load_dotenv()

app = FastAPI()

# Mount static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Import modular schemas, agent logic, and usage tracker
from src.schemas import StartChatRequest, StartChatResponse, SendMessageRequest, SendMessageResponse, ConfigRequest, ImproveMessageRequest, VibeReviewRequest, VibeReviewResponse, VibeReviewItem, InitiateChatRequest, InitiateChatResponse, GetOpenersRequest, GetOpenersResponse, OpenerItem, MisinterpretRequest, MisinterpretResponse, MisinterpretItem, BanterRequest, BanterResponse, BanterExchange, GenerateScenarioRequest, GenerateScenarioResponse
from src.agent import generate_scenario, generate_next_reply, generate_improved_options, generate_vibe_review, initiate_chat_scenario, generate_random_scenario
from src.agent_get_opener import generate_openers_agent
from src.agent_misinterpret import generate_misinterpretations_agent
from src.agent_banter import generate_banter_agent
from src.usage_tracker import is_user_within_quota, get_user_usage
import logging

logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("improveconvo")

def extract_persona_from_request(req_model, request: Request = None) -> str:
    val = (
        getattr(req_model, "persona_type", None)
        or getattr(req_model, "partner_persona", None)
        or getattr(req_model, "persona", None)
        or getattr(req_model, "mode", None)
    )
    if not val and hasattr(req_model, "__dict__"):
        d = req_model.__dict__
        val = d.get("persona_type") or d.get("partner_persona") or d.get("persona") or d.get("mode")
    if not val and request:
        val = (
            request.query_params.get("persona_type")
            or request.query_params.get("partner_persona")
            or request.query_params.get("persona")
            or request.query_params.get("mode")
        )
    if not val and request:
        val = (
            request.headers.get("x-persona-type")
            or request.headers.get("x-partner-persona")
            or request.headers.get("x-persona")
        )
    return (val or "normal").strip().lower()

@app.middleware("http")
async def token_restriction_middleware(request: Request, call_next):
    user_id = request.headers.get("x-user-id") or request.headers.get("X-User-ID")
    if not user_id:
        user_id = request.client.host if request.client and request.client.host else "anonymous_client"
    
    request.state.user_id = user_id
    
    # Restrict API calls if daily token limit exceeded
    exempt_paths = ["/api/config", "/api/user-usage"]
    if request.url.path.startswith("/api/") and request.url.path not in exempt_paths:
        is_allowed, current_tokens, limit = is_user_within_quota(user_id)
        if not is_allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Daily token limit reached for user/IP ({current_tokens}/{limit} tokens). Please try again tomorrow.",
                    "user_id": user_id,
                    "tokens_used": current_tokens,
                    "daily_limit": limit
                }
            )
            
    response = await call_next(request)
    return response

@app.get("/")
def get_root():
    return FileResponse(os.path.join(static_dir, "index.html"))

@app.get("/api/user-usage")
def get_user_usage_endpoint(request: Request):
    user_id = getattr(request.state, "user_id", None) or "anonymous_client"
    usage = get_user_usage(user_id)
    is_allowed, current_tokens, limit = is_user_within_quota(user_id)
    return {
        "user_id": user_id,
        "tokens_used": current_tokens,
        "request_count": usage.get("request_count", 0),
        "daily_limit": limit,
        "remaining_tokens": max(0, limit - current_tokens),
        "usage_date": usage.get("usage_date")
    }

@app.get("/api/config")
def get_config():
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    return {
        "has_key": bool(api_key),
        "model_name": model_name
    }

@app.post("/api/config")
def save_config(req: ConfigRequest):
    model = req.model_name.strip() if req.model_name else "gemini-2.5-flash"
    key = os.getenv("GEMINI_API_KEY", "")
        
    # Save to .env
    with open(".env", "w") as f:
        f.write(f"GEMINI_API_KEY={key}\n")
        f.write(f"GEMINI_MODEL={model}\n")
    
    # Reload environment variables
    os.environ["GEMINI_MODEL"] = model
    return {"status": "success", "has_key": bool(key), "model_name": model}

@app.post("/api/start-chat", response_model=StartChatResponse)
def api_start_chat(req: StartChatRequest, request: Request):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        user_id = getattr(request.state, "user_id", None)
        persona = extract_persona_from_request(req, request)
        result = generate_scenario(context=req.context, model_name=model_name, user_id=user_id, partner_persona=persona)
        return StartChatResponse(
            scenario=result.get("scenario", "Standard texting scenario"),
            first_message=result.get("first_message", "Hey!")
        )
    except Exception as e:
        logger.error(f"[/api/start-chat] error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send-message", response_model=SendMessageResponse)
def api_send_message(req: SendMessageRequest, request: Request):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        user_id = getattr(request.state, "user_id", None)
        persona = extract_persona_from_request(req, request)
        
        # Convert history models to dicts
        history_dicts = [
            {"sender": msg.sender, "body": msg.body}
            for msg in req.chat_history
        ]
        
        # Append the new user message to the history dicts for next response context
        history_dicts.append({"sender": "Me", "body": req.message})
        
        reply = generate_next_reply(
            context=req.context,
            scenario=req.scenario,
            history=history_dicts,
            model_name=model_name,
            user_id=user_id,
            partner_persona=persona
        )
        return SendMessageResponse(reply=reply, persona_type=persona)
    except Exception as e:
        logger.error(f"[/api/send-message] error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/improve-message")
def api_improve_message(req: ImproveMessageRequest, request: Request):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        user_id = getattr(request.state, "user_id", None)
        
        # Convert history models to dicts
        history_dicts = [
            {"sender": msg.sender, "body": msg.body}
            for msg in req.chat_history
        ]
        
        result = generate_improved_options(
            context=req.context,
            scenario=req.scenario,
            history=history_dicts,
            message_to_improve=req.message_to_improve,
            model_name=model_name,
            user_id=user_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vibe-review", response_model=VibeReviewResponse)
def api_vibe_review(req: VibeReviewRequest, request: Request):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        user_id = getattr(request.state, "user_id", None)
        
        # Convert history models to dicts
        history_dicts = [
            {"sender": msg.sender, "body": msg.body}
            for msg in req.chat_history
        ]
        
        result = generate_vibe_review(
            context=req.context,
            scenario=req.scenario,
            history=history_dicts,
            model_name=model_name,
            user_id=user_id
        )
        return VibeReviewResponse(
            overall_feedback=result.get("overall_feedback", "No feedback available."),
            score=result.get("score", 70),
            comparisons=[
                VibeReviewItem(
                    original_message=item.get("original_message", ""),
                    improved_message=item.get("improved_message", ""),
                    explanation=item.get("explanation", "")
                )
                for item in result.get("comparisons", [])
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/initiate-chat", response_model=InitiateChatResponse)
def api_initiate_chat(req: InitiateChatRequest, request: Request):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        user_id = getattr(request.state, "user_id", None)
        persona = extract_persona_from_request(req, request)
        result = initiate_chat_scenario(
            user_first_input=req.user_first_input,
            model_name=model_name,
            user_id=user_id,
            partner_persona=persona
        )
        return InitiateChatResponse(
            context=result.get("context", "No context parsed."),
            scenario=result.get("scenario", "Simple Chat"),
            cleaned_user_message=result.get("cleaned_user_message", req.user_first_input),
            partner_reply=result.get("partner_reply", "Hey!")
        )
    except Exception as e:
        logger.error(f"[/api/initiate-chat] error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-scenario", response_model=GenerateScenarioResponse)
@app.post("/api/generate-scenario/", response_model=GenerateScenarioResponse)
@app.get("/api/generate-scenario", response_model=GenerateScenarioResponse)
@app.get("/api/generate-scenario/", response_model=GenerateScenarioResponse)
async def api_generate_scenario(request: Request):
    try:
        body = await request.json() if request.method == "POST" else {}
    except Exception:
        body = {}
    
    category = body.get("category") or request.query_params.get("category")
    prev = body.get("previous_scenario") or request.query_params.get("previous_scenario")
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    user_id = getattr(request.state, "user_id", None)
    
    scenario_text = generate_random_scenario(
        category=category,
        previous_scenario=prev,
        model_name=model_name,
        user_id=user_id
    )
    return GenerateScenarioResponse(scenario=scenario_text)


@app.get("/openers")
def get_openers_page():
    return FileResponse(os.path.join(static_dir, "openers.html"))

@app.post("/api/get-openers", response_model=GetOpenersResponse)
def api_get_openers(req: GetOpenersRequest, request: Request):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        user_id = getattr(request.state, "user_id", None)
        result = generate_openers_agent(
            scenario_text=req.scenario_text,
            image_base64=req.image_base64,
            model_name=model_name,
            user_id=user_id
        )
        openers_list = []
        for item in result.get("openers", []):
            openers_list.append(OpenerItem(
                text=item.get("text", ""),
                vibe=item.get("vibe", ""),
                explanation=item.get("explanation", "")
            ))
        return GetOpenersResponse(openers=openers_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/misinterpret")
def get_misinterpret_page():
    return FileResponse(os.path.join(static_dir, "misinterpret.html"))

@app.post("/api/misinterpret", response_model=MisinterpretResponse)
def api_misinterpret(req: MisinterpretRequest, request: Request):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        user_id = getattr(request.state, "user_id", None)
        result = generate_misinterpretations_agent(
            partner_text=req.partner_text,
            model_name=model_name,
            user_id=user_id
        )
        items_list = []
        for item in result.get("misinterpretations", []):
            items_list.append(MisinterpretItem(
                style=item.get("style", ""),
                text=item.get("text", ""),
                explanation=item.get("explanation", "")
            ))
        return MisinterpretResponse(
            partner_text=result.get("partner_text", req.partner_text or "Random Partner Text"),
            misinterpretations=items_list
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/banter")
def get_banter_page():
    return FileResponse(os.path.join(static_dir, "banter.html"))

@app.post("/api/banter", response_model=BanterResponse)
def api_banter(req: BanterRequest, request: Request):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        user_id = getattr(request.state, "user_id", None)
        history_dicts = None
        if req.chat_history:
            history_dicts = [{"sender": m.sender, "body": m.body} for m in req.chat_history]

        result = generate_banter_agent(
            topic=req.topic,
            num_turns=req.num_turns or 8,
            persona_a_name=req.persona_a_name,
            persona_a_style=req.persona_a_style,
            persona_b_name=req.persona_b_name,
            persona_b_style=req.persona_b_style,
            chat_history=history_dicts,
            model_name=model_name,
            user_id=user_id
        )

        exchanges = [
            BanterExchange(speaker=ex.get("speaker", ""), text=ex.get("text", ""))
            for ex in result.get("exchanges", [])
        ]
        return BanterResponse(
            topic=result.get("topic", ""),
            persona_a=result.get("persona_a", "Alex"),
            persona_b=result.get("persona_b", "Jordan"),
            exchanges=exchanges
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)

