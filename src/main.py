import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load env variables
load_dotenv()

app = FastAPI()

# Mount static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Import modular schemas and agent logic
from src.schemas import StartChatRequest, StartChatResponse, SendMessageRequest, SendMessageResponse, ConfigRequest, ImproveMessageRequest, VibeReviewRequest, VibeReviewResponse, VibeReviewItem, InitiateChatRequest, InitiateChatResponse, GetOpenersRequest, GetOpenersResponse, OpenerItem, MisinterpretRequest, MisinterpretResponse, MisinterpretItem, BanterRequest, BanterResponse, BanterExchange
from src.agent import generate_scenario, generate_next_reply, generate_improved_options, generate_vibe_review, initiate_chat_scenario
from src.agent_get_opener import generate_openers_agent
from src.agent_misinterpret import generate_misinterpretations_agent
from src.agent_banter import generate_banter_agent

@app.get("/")
def get_root():
    return FileResponse(os.path.join(static_dir, "index.html"))

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
def api_start_chat(req: StartChatRequest):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        result = generate_scenario(context=req.context, model_name=model_name)
        return StartChatResponse(
            scenario=result.get("scenario", "Standard texting scenario"),
            first_message=result.get("first_message", "Hey!")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send-message", response_model=SendMessageResponse)
def api_send_message(req: SendMessageRequest):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        
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
            model_name=model_name
        )
        return SendMessageResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/improve-message")
def api_improve_message(req: ImproveMessageRequest):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        
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
            model_name=model_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vibe-review", response_model=VibeReviewResponse)
def api_vibe_review(req: VibeReviewRequest):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        
        # Convert history models to dicts
        history_dicts = [
            {"sender": msg.sender, "body": msg.body}
            for msg in req.chat_history
        ]
        
        result = generate_vibe_review(
            context=req.context,
            scenario=req.scenario,
            history=history_dicts,
            model_name=model_name
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
def api_initiate_chat(req: InitiateChatRequest):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        result = initiate_chat_scenario(
            user_first_input=req.user_first_input,
            model_name=model_name
        )
        return InitiateChatResponse(
            context=result.get("context", "No context parsed."),
            scenario=result.get("scenario", "Simple Chat"),
            cleaned_user_message=result.get("cleaned_user_message", req.user_first_input),
            partner_reply=result.get("partner_reply", "Hey!")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/openers")
def get_openers_page():
    return FileResponse(os.path.join(static_dir, "openers.html"))

@app.post("/api/get-openers", response_model=GetOpenersResponse)
def api_get_openers(req: GetOpenersRequest):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        result = generate_openers_agent(
            scenario_text=req.scenario_text,
            image_base64=req.image_base64,
            model_name=model_name
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
def api_misinterpret(req: MisinterpretRequest):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        result = generate_misinterpretations_agent(
            partner_text=req.partner_text,
            model_name=model_name
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
def api_banter(req: BanterRequest):
    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        result = generate_banter_agent(
            topic=req.topic,
            num_turns=req.num_turns or 8,
            model_name=model_name
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
