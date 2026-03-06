import re
import hashlib

# ── Verhoeff tables ───────────────────────────────────────────────────────────

_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

AADHAAR_KEYWORDS = ["government of india", "aadhaar", "uidai"]


def validate_aadhaar(number: str) -> bool:
    """Verhoeff checksum validation for 12-digit Aadhaar number."""
    if len(number) != 12 or not number.isdigit():
        return False
    c = 0
    num = number[::-1]
    for i, item in enumerate(num):
        c = _D[c][_P[i % 8][int(item)]]
    return c == 0


def extract_aadhaar_number(text: str):
    match = re.search(r"\b\d{4}\s?\d{4}\s?\d{4}\b", text)
    if match:
        return match.group().replace(" ", "")
    return None


def keyword_score(text: str) -> int:
    return sum(1 for word in AADHAAR_KEYWORDS if word in text)


def extract_text_from_image(image_bytes: bytes) -> str:
    try:
        import pytesseract  # noqa: F401
        import cv2
        import numpy as np

        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        text = pytesseract.image_to_string(gray)
        return text.lower()
    except ImportError:
        raise RuntimeError(
            "pytesseract and opencv-python required. "
            "Run: pip install pytesseract opencv-python pillow\n"
            "Also install Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki"
        )


def verify_aadhaar_image(image_bytes: bytes):
    """Returns (is_valid: bool, result: str) where result is aadhaar number or error msg."""
    text = extract_text_from_image(image_bytes)
    aadhaar = extract_aadhaar_number(text)

    if not aadhaar:
        return False, "No Aadhaar number detected in image"

    if not validate_aadhaar(aadhaar):
        return False, "Invalid Aadhaar number (Verhoeff checksum failed)"

    if keyword_score(text) < 1:
        return False, "Document does not appear to be an Aadhaar card"

    return True, aadhaar


def hash_aadhaar(aadhaar: str) -> str:
    return hashlib.sha256(aadhaar.encode()).hexdigest()
