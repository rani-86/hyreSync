from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def compute_fit_score(resume_text: str, job_description: str) -> float:
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
    similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])
    score = similarity[0][0]
    return round(score * 100, 2)