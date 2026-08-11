import re

INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|above)\s+instructions",
    r"(?i)forget\s+(everything|all)\s+you",
    r"(?i)you\s+are\s+(now|not)\s+(an?\s+)?\w+",
    r"(?i)system\s+prompt",
    r"(?i)reset\s+(conversation|chat|session)",
    r"<\s*(system|user|assistant)\s*>",
]

def detect_injection(text: str) -> bool:
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text):
            return True
    return False

def sanitize_user_input(text: str, max_length: int = 4000) -> str:
    if len(text) > max_length:
        text = text[:max_length] + "..."
    if detect_injection(text):
        text = f"[Content filtered: potential prompt injection detected]\n\n{text[:500]}"
    return text
