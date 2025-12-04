# Meme Generator Backend

Minimal FastAPI backend exposing `/meme-generation`.

Run (PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# create a `.env` (copy `.env.example`) and optionally set OPENAI_API_KEY
uvicorn app:app --host 0.0.0.0 --port 8000
```

Endpoint: `POST /meme-generation`
- multipart form-data
- fields:
  - `image`: file (jpg/png), required
  - `text`: string, required
  - `font_size`: int, optional (default 40)
  - `color`: hex or name, optional (default `white`)
  - `position`: `top`, `bottom`, `center`, or `x,y` (default `bottom`)

Response: processed image (`image/png`). Uploaded files are validated and temporary files are removed after response.

Notes:
- CORS is wide open for minimal developer usage. Lock this down for production.
- The code optionally uses OpenAI's `gemini-2.5-flash-lite` when `OPENAI_API_KEY` is set to enhance/sanitize text. This is optional.
