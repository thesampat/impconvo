import os
import sys

# Ensure project root is in sys.path when running as a script (e.g. `python src/main.py`)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load env variables
load_dotenv()

app = FastAPI()

# Import modular schemas, agent logic, and usage tracker
from src.schemas import StartChatRequest, StartChatResponse, SendMessageRequest, SendMessageResponse, ImproveMessageRequest, VibeReviewRequest, VibeReviewResponse, VibeReviewItem, InitiateChatRequest, InitiateChatResponse, GetOpenersRequest, GetOpenersResponse, OpenerItem, MisinterpretRequest, MisinterpretResponse, MisinterpretItem, BanterRequest, BanterResponse, BanterExchange, GenerateScenarioRequest, GenerateScenarioResponse, AnalyzeScenarioRequest, AnalyzeScenarioResponse
from src.agent import generate_scenario, generate_next_reply, generate_improved_options, generate_vibe_review, initiate_chat_scenario, generate_random_scenario
from src.agent_get_opener import generate_openers_agent
from src.agent_misinterpret import generate_misinterpretations_agent
from src.agent_banter import generate_banter_agent, analyze_scenario_agent
from src.usage_tracker import (
    AVAILABLE_MODELS, MAX_LIMIT, LIMIT_KEYS, GLOBAL_KEY, DEVICE_PREFIX, IP_PREFIX,
    get_settings, update_settings, make_subject, get_tokens_for_keys, get_user_usage,
    get_usage_overview, get_usage_history, get_admin_failures, record_admin_failure,
    PROVIDER_DAILY_REQUEST_CAPS,
)
import hmac
import re
import logging

logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("improveconvo")

DEVICE_ID_RE = re.compile(r"^[a-z0-9-]{16,64}$")
MAX_ADMIN_FAILURES_PER_DAY = 10

# Paths that are never usage-limited (admin endpoints are matched by prefix).
UNLIMITED_PATHS = {"/api/config", "/api/user-usage"}
ADMIN_PREFIX = "/api/admin/"


def resolve_model() -> str:
    """Every AI call uses the admin-controlled default model (no per-request override)."""
    return get_settings()["default_model"]


def get_client_ip(request: Request) -> str:
    """Best-effort client IP.

    On Cloud Run (K_SERVICE is set) the Google front end appends the real client IP as the
    right-most X-Forwarded-For entry; anything to its left can be spoofed by the client.
    TODO: verify this behaviour after deploying (log X-Forwarded-For once and compare).
    Locally, use the socket peer address.
    """
    if os.getenv("K_SERVICE"):
        xff = request.headers.get("x-forwarded-for") or ""
        parts = [p.strip() for p in xff.split(",") if p.strip()]
        if parts:
            return parts[-1]
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def get_device_id(request: Request):
    raw = (request.headers.get("x-device-id") or "").strip()
    return raw if DEVICE_ID_RE.match(raw) else None


def _admin_code() -> str:
    return (os.getenv("ADMIN_CODE") or "").strip()


def _code_matches(provided: str, expected: str) -> bool:
    return hmac.compare_digest(provided.encode("utf-8"), expected.encode("utf-8"))


def _admin_device_ids() -> set:
    """Optional ADMIN_DEVICE_IDS (comma-separated): when set, admin works only from these installs."""
    return {d.strip() for d in (os.getenv("ADMIN_DEVICE_IDS") or "").split(",") if d.strip()}


def _admin_device_allowed(request: Request) -> bool:
    allowed = _admin_device_ids()
    return not allowed or get_device_id(request) in allowed


def require_admin(request: Request) -> None:
    """Raise unless the request carries the right X-Admin-Code (with a per-IP daily brute-force guard)."""
    expected = _admin_code()
    if not expected:
        raise HTTPException(status_code=503, detail="Admin access is not configured")
    ip = getattr(request.state, "client_ip", None) or get_client_ip(request)
    if get_admin_failures(ip) >= MAX_ADMIN_FAILURES_PER_DAY:
        raise HTTPException(status_code=429, detail="Too many attempts. Try again tomorrow.")
    provided = (request.headers.get("x-admin-code") or "").strip()
    # A right code from a device that isn't allowed is treated exactly like a wrong code
    if not provided or not _code_matches(provided, expected) or not _admin_device_allowed(request):
        record_admin_failure(ip)
        raise HTTPException(status_code=401, detail="Invalid admin code")


def _is_admin_request(request: Request, ip: str) -> bool:
    """Admin bypass for regular endpoints. A wrong code counts as a failed attempt and is otherwise ignored."""
    provided = (request.headers.get("x-admin-code") or "").strip()
    expected = _admin_code()
    if not provided or not expected:
        return False
    if get_admin_failures(ip) >= MAX_ADMIN_FAILURES_PER_DAY:
        return False
    if _code_matches(provided, expected) and _admin_device_allowed(request):
        return True
    record_admin_failure(ip)
    return False


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
    path = request.url.path
    ip = get_client_ip(request)
    device_id = get_device_id(request)
    request.state.client_ip = ip
    request.state.device_id = device_id
    # Opaque subject; the agents pass it back to record_user_usage, which splits it into counter keys.
    request.state.user_id = make_subject(device_id, ip)

    limited = path.startswith("/api/") and path not in UNLIMITED_PATHS and not path.startswith(ADMIN_PREFIX)
    if limited:
        if _is_admin_request(request, ip):
            # Admin skips all limits; tokens still count toward "global" (under "admin").
            request.state.user_id = make_subject(None, None, is_admin=True)
        else:
            settings = get_settings()
            device_key = DEVICE_PREFIX + device_id if device_id else None
            ip_key = IP_PREFIX + ip
            keys = [k for k in (device_key, ip_key, GLOBAL_KEY) if k]
            used = get_tokens_for_keys(keys)
            detail = None
            if device_key and used[device_key] >= settings["device_daily_limit"]:
                detail = "You've reached today's usage limit on this device. Please try again tomorrow."
            elif used[ip_key] >= settings["ip_daily_limit"]:
                detail = "Today's usage limit for your network has been reached. Please try again tomorrow."
            elif used[GLOBAL_KEY] >= settings["global_daily_limit"]:
                detail = "The service is busy and has reached its capacity for today. Please try again tomorrow."
            if detail:
                return JSONResponse(status_code=429, content={"detail": detail})

    return await call_next(request)

# Let the Expo web build (served from localhost during development) call the API.
# Added after the token middleware so it wraps it and 429s/401s still carry CORS headers.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def get_root():
    return {"status": "ok"}

@app.get("/api/config")
def get_config():
    # Connection check only; deliberately reveals nothing about models or keys.
    return {"status": "ok"}

@app.get("/api/user-usage")
def get_user_usage_endpoint(request: Request):
    """The caller's own usage today (by device id, or IP if no valid device id)."""
    settings = get_settings()
    device_id = getattr(request.state, "device_id", None)
    if device_id:
        key, limit = DEVICE_PREFIX + device_id, settings["device_daily_limit"]
    else:
        ip = getattr(request.state, "client_ip", None) or get_client_ip(request)
        key, limit = IP_PREFIX + ip, settings["ip_daily_limit"]
    usage = get_user_usage(key)
    tokens = usage["token_count"]
    return {
        "tokens_used": tokens,
        "request_count": usage["request_count"],
        "daily_limit": limit,
        "remaining_tokens": max(0, limit - tokens),
        "usage_date": usage["usage_date"],
    }

def _settings_payload(request: Request) -> dict:
    s = get_settings()
    return {
        "default_model": s["default_model"],
        "available_models": list(AVAILABLE_MODELS),
        "device_daily_limit": s["device_daily_limit"],
        "ip_daily_limit": s["ip_daily_limit"],
        "global_daily_limit": s["global_daily_limit"],
        # Lets the owner copy this install's id into ADMIN_DEVICE_IDS
        "your_device_id": get_device_id(request),
        "device_locked": bool(_admin_device_ids()),
    }

@app.get("/api/admin/settings")
def admin_get_settings(request: Request):
    require_admin(request)
    return _settings_payload(request)

@app.post("/api/admin/settings")
async def admin_update_settings(request: Request):
    require_admin(request)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body must be a JSON object.")
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Body must be a JSON object.")

    changes = {}
    if "default_model" in body:
        model = body["default_model"]
        if not isinstance(model, str) or model not in AVAILABLE_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"default_model must be one of: {', '.join(AVAILABLE_MODELS)}",
            )
        changes["default_model"] = model
    for key in LIMIT_KEYS:
        if key in body:
            value = body[key]
            # bool is a subclass of int in Python; reject it explicitly.
            if isinstance(value, bool) or not isinstance(value, int) or value < 0 or value > MAX_LIMIT:
                raise HTTPException(
                    status_code=400,
                    detail=f"{key} must be a whole number between 0 and {MAX_LIMIT}.",
                )
            changes[key] = value

    update_settings(changes)
    return _settings_payload(request)

@app.get("/api/admin/usage")
def admin_get_usage(request: Request):
    require_admin(request)
    settings = get_settings()
    overview = get_usage_overview(limit=50)
    return {
        "usage_date": overview["usage_date"],
        "global_tokens": overview["global_tokens"],
        "global_requests": overview["global_requests"],
        "global_limit": settings["global_daily_limit"],
        "device_limit": settings["device_daily_limit"],
        "ip_limit": settings["ip_daily_limit"],
        "devices": overview["devices"],
        "ips": overview["ips"],
        "model": settings["default_model"],
        "provider_daily_requests": PROVIDER_DAILY_REQUEST_CAPS.get(settings["default_model"]),
        **get_usage_history(days=7),
    }

@app.post("/api/start-chat", response_model=StartChatResponse)
def api_start_chat(req: StartChatRequest, request: Request):
    try:
        model_name = resolve_model()
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
        model_name = resolve_model()
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
        model_name = resolve_model()
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
        model_name = resolve_model()
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
        model_name = resolve_model()
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
    model_name = resolve_model()
    user_id = getattr(request.state, "user_id", None)
    
    scenario_text = generate_random_scenario(
        category=category,
        previous_scenario=prev,
        model_name=model_name,
        user_id=user_id
    )
    return GenerateScenarioResponse(scenario=scenario_text)


@app.post("/api/analyze-scenario", response_model=AnalyzeScenarioResponse)
def api_analyze_scenario(req: AnalyzeScenarioRequest, request: Request):
    if not req.scenario.strip():
        raise HTTPException(status_code=400, detail="Scenario is empty.")
    try:
        result = analyze_scenario_agent(
            scenario=req.scenario,
            model_name=resolve_model(),
            user_id=getattr(request.state, "user_id", None)
        )
        return AnalyzeScenarioResponse(**result)
    except Exception as e:
        logger.error(f"Error in /api/analyze-scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/get-openers", response_model=GetOpenersResponse)
def api_get_openers(req: GetOpenersRequest, request: Request):
    try:
        model_name = resolve_model()
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

@app.post("/api/misinterpret", response_model=MisinterpretResponse)
def api_misinterpret(req: MisinterpretRequest, request: Request):
    try:
        model_name = resolve_model()
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

@app.post("/api/banter", response_model=BanterResponse)
def api_banter(req: BanterRequest, request: Request):
    try:
        model_name = resolve_model()
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
            setting=req.setting,
            starter=req.starter,
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

