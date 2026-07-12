from sentence_transformers import SentenceTransformer, util

# Load the model once when this module is imported, not on every request —
# loading it repeatedly would be extremely slow
model = SentenceTransformer('all-MiniLM-L6-v2')

def compute_fit_score(resume_text: str, job_description: str) -> float:
    embeddings = model.encode([resume_text, job_description], convert_to_tensor=True)
    similarity = util.cos_sim(embeddings[0], embeddings[1])
    score = similarity.item()
    return round(score * 100, 2)