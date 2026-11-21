import os

# Must be set before any ml-service module is imported, since llm_explainer
# reads GROQ_API_KEY at import time and main.py reads ML_INTERNAL_KEY/SERVER_URL.
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("ML_INTERNAL_KEY", "test-internal-key")
os.environ.setdefault("SERVER_URL", "")
