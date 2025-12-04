import os
import io
import tempfile
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont


load_dotenv()

MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 5 * 1024 * 1024))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


app = FastAPI(title="Meme Generator (minimal)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _apply_text_to_image(img: Image.Image, text: str, font_size: int = 40, color: str = "white", position: str = "bottom") -> Image.Image:
    draw = ImageDraw.Draw(img)
    # helper to compute text size with Pillow compatibility across versions
    def _text_size(d: ImageDraw.ImageDraw, txt: str, font: ImageFont.ImageFont):
        try:
            # textbbox returns (left, top, right, bottom)
            bbox = d.textbbox((0, 0), txt, font=font)
            return (bbox[2] - bbox[0], bbox[3] - bbox[1])
        except Exception:
            try:
                return d.textsize(txt, font=font)
            except Exception:
                try:
                    return font.getsize(txt)
                except Exception:
                    # worst-case fallback
                    return (0, 0)
    try:
        # Try a common TTF; fallback to default
        font = ImageFont.truetype("arial.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    # multiline wrap basic handling
    # compute text size
    max_width = img.width - 20
    lines = []
    words = text.split()
    if not words:
        lines = [""]
    else:
        cur = words[0]
        for w in words[1:]:
            size = _text_size(draw, cur + " " + w, font)
            if size[0] <= max_width:
                cur = cur + " " + w
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)

    text_height = sum(_text_size(draw, line, font)[1] for line in lines)

    if position.lower() == "top":
        y = 10
    elif position.lower() == "center":
        y = (img.height - text_height) // 2
    elif "," in position:
        try:
            x_str, y_str = position.split(",")
            x = int(x_str.strip())
            y = int(y_str.strip())
        except Exception:
            x = 10
            y = img.height - text_height - 10
    else:
        y = img.height - text_height - 10

    # draw each line centered
    for line in lines:
        w, h = _text_size(draw, line, font)
        if "," in position and 'x' in locals():
            x_pos = x
        else:
            x_pos = (img.width - w) // 2

        # draw outline for readability
        outline_range = max(1, font_size // 15)
        for ox in range(-outline_range, outline_range + 1):
            for oy in range(-outline_range, outline_range + 1):
                draw.text((x_pos + ox, y + oy), line, font=font, fill="black")
        draw.text((x_pos, y), line, font=font, fill=color)
        y += h

    return img


async def _read_image_and_validate(upload: UploadFile) -> Image.Image:
    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large (max {MAX_UPLOAD_SIZE} bytes)")

    try:
        img = Image.open(io.BytesIO(content)).convert("RGBA")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    return img


def _maybe_enhance_text_with_llm(text: str) -> str:
    # Optional: if OPENAI_API_KEY is set, try to call the OpenAI API to sanitize/shorten text
    if not OPENAI_API_KEY:
        return text

    try:
        try:
            # new OpenAI python client
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            prompt = f"Shorten and make this meme text punchy but keep meaning: {text}"
            r = client.chat.create(model="gemini-2.5-flash-lite", messages=[{"role": "user", "content": prompt}], max_tokens=60)
            out = r.choices[0].message.content.strip()
            if out:
                return out
        except Exception:
            # fallback to legacy openai package usage
            import openai
            openai.api_key = OPENAI_API_KEY
            resp = openai.ChatCompletion.create(model="gemini-2.5-flash-lite", messages=[{"role": "user", "content": f"Shorten and make this meme text punchy: {text}"}], max_tokens=60)
            return resp.choices[0].message.content.strip()
    except Exception:
        # If any error occurs, just return original text
        return text


@app.post("/meme-generation")
async def meme_generation(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    text: str = Form(...),
    font_size: Optional[int] = Form(40),
    color: Optional[str] = Form("white"),
    position: Optional[str] = Form("bottom"),
):
    """Accepts an image and text, returns the image with text overlayed.

    - Validates size (< configurable MAX_UPLOAD_SIZE)
    - Optionally enhances text with OpenAI Gemini model when `OPENAI_API_KEY` is set
    - Returns a PNG image
    """
    img = await _read_image_and_validate(image)

    # Optionally use LLM to enhance text
    processed_text = _maybe_enhance_text_with_llm(text)

    # apply text
    out_img = _apply_text_to_image(img, processed_text, font_size=font_size, color=color, position=position)

    # save to temp file and return with background deletion
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    tmp_path = tmp.name
    try:
        out_img.convert("RGB").save(tmp_path, format="PNG")
        tmp.close()
    finally:
        try:
            tmp.close()
        except Exception:
            pass

    def _cleanup(path: str):
        try:
            os.remove(path)
        except Exception:
            pass

    background_tasks.add_task(_cleanup, tmp_path)
    return FileResponse(tmp_path, media_type="image/png", filename="meme.png")


@app.post("/create-meme")
async def create_meme(
    background_tasks: BackgroundTasks,
    meme: Optional[UploadFile] = File(None),
    topText: Optional[str] = Form(None),
    bottomText: Optional[str] = Form(None),
    fontSize: Optional[int] = Form(40),
    fontColor: Optional[str] = Form("white"),
    topX: Optional[str] = Form(None),
    topY: Optional[str] = Form(None),
    bottomX: Optional[str] = Form(None),
    bottomY: Optional[str] = Form(None),
):
    """Compatibility endpoint used by the lightweight PHP frontend.

    Accepts form fields used by the frontend and returns a PNG image.
    - `meme`: image file (UploadFile)
    - `topText` / `bottomText`: optional strings
    - `fontSize`, `fontColor`: styling
    - optional `topX,topY,bottomX,bottomY` to place text at explicit coordinates
    """
    if meme is None:
        raise HTTPException(status_code=400, detail="No image file provided in field 'meme'")

    img = await _read_image_and_validate(meme)

    out_img = img

    def _parse_int_field(v: Optional[str]) -> Optional[int]:
        if v is None:
            return None
        v = str(v).strip()
        if v == "":
            return None
        try:
            return int(float(v))
        except Exception:
            return None

    t_x = _parse_int_field(topX)
    t_y = _parse_int_field(topY)
    b_x = _parse_int_field(bottomX)
    b_y = _parse_int_field(bottomY)

    # apply top text if provided
    if topText:
        if t_x is not None and t_y is not None:
            pos = f"{t_x},{t_y}"
        else:
            pos = "top"
        out_img = _apply_text_to_image(out_img, topText, font_size=fontSize or 40, color=fontColor or "white", position=pos)

    # apply bottom text if provided
    if bottomText:
        if b_x is not None and b_y is not None:
            pos = f"{b_x},{b_y}"
        else:
            pos = "bottom"
        out_img = _apply_text_to_image(out_img, bottomText, font_size=fontSize or 40, color=fontColor or "white", position=pos)

    # save to temp file and return with background deletion (reuse same pattern)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    tmp_path = tmp.name
    try:
        out_img.convert("RGB").save(tmp_path, format="PNG")
        tmp.close()
    finally:
        try:
            tmp.close()
        except Exception:
            pass

    def _cleanup(path: str):
        try:
            os.remove(path)
        except Exception:
            pass

    background_tasks.add_task(_cleanup, tmp_path)
    return FileResponse(tmp_path, media_type="image/png", filename="meme.png")
