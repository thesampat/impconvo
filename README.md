# Chat Elevate

Chat Elevate is an AI-powered texting and conversation coach designed to help you improve your messaging skills, master playful banter, and craft high-engagement opening lines.

## Key Features

- Chat Simulation: Practice texting in realistic scenarios with an interactive, AI-driven partner.
- Smart Suggestions: Get wittier, flirty, or casual alternative suggestions for any message.
- Vibe Review: Analyze your conversations to receive an engagement score and line-by-line feedback.
- Opener Generator: Create tailored online or in-person approach lines based on descriptions or profile screenshots.
- Misinterpretation Builder: Learn how to build tension by deliberately misinterpreting statements in charming or teasing ways.
- Banter Simulator: Generate playful, back-and-forth mock scripts between witty personas.

## Screenshots

![Chat Screen](docs/screenshot-chat.jpeg)
![Suggestions Screen](docs/screenshot-suggestions.jpeg)

## Quick Start

1. Install Dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure Environment:
   Create a .env file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash
   ```

3. Run the App:
   ```bash
   python src/main.py
   ```
   Open http://localhost:8000 in your browser.
