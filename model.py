import string
import re
import time
import spacy
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Download NLTK data silently
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# ─── Curated skill/technology keywords ───
TECH_SKILLS = {
    # Programming languages
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go",
    "rust", "swift", "kotlin", "php", "scala", "r", "matlab", "perl", "dart",
    "html", "css", "sass", "less", "sql", "nosql", "graphql", "bash", "shell",
    # Frameworks & Libraries
    "react", "angular", "vue", "svelte", "next.js", "nuxt", "express", "django",
    "flask", "fastapi", "spring", "spring boot", "rails", "laravel", "asp.net",
    "node.js", "nodejs", ".net", "jquery", "bootstrap", "tailwind", "material ui",
    # Data / ML / AI
    "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "pandas", "numpy",
    "matplotlib", "seaborn", "opencv", "nltk", "spacy", "huggingface", "transformers",
    "machine learning", "deep learning", "natural language processing", "nlp",
    "computer vision", "data science", "data analysis", "data engineering",
    "artificial intelligence", "neural networks", "reinforcement learning",
    # Cloud & DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins",
    "terraform", "ansible", "ci/cd", "git", "github", "gitlab", "bitbucket",
    "linux", "unix", "nginx", "apache",
    # Databases
    "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
    "dynamodb", "firebase", "sqlite", "oracle", "sql server", "mariadb",
    # Tools & Concepts
    "rest", "restful", "api", "microservices", "agile", "scrum", "kanban",
    "jira", "confluence", "figma", "photoshop", "illustrator",
    "unit testing", "integration testing", "tdd", "bdd",
    "oauth", "jwt", "authentication", "authorization",
    # Soft skills
    "leadership", "communication", "teamwork", "problem solving",
    "project management", "time management", "critical thinking",
    "collaboration", "presentation", "mentoring",
}

EDUCATION_LEVELS = {
    "phd": 5, "ph.d": 5, "doctorate": 5, "doctoral": 5,
    "master": 4, "masters": 4, "m.s.": 4, "m.sc": 4, "mba": 4, "m.tech": 4,
    "bachelor": 3, "bachelors": 3, "b.s.": 3, "b.sc": 3, "b.tech": 3, "b.e.": 3,
    "associate": 2, "diploma": 2,
    "high school": 1, "secondary": 1, "ged": 1,
}


def preprocess_spacy(text):
    """Use spaCy for lemmatization and stop word removal."""
    doc = nlp(text.lower())
    tokens = [
        token.lemma_ for token in doc
        if not token.is_stop and not token.is_punct and not token.is_space and len(token.text) > 1
    ]
    return " ".join(tokens)


def extract_skills(text):
    """Extract recognized skills from text."""
    text_lower = text.lower()
    found_skills = set()

    for skill in TECH_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.add(skill)

    # Also use spaCy NER to find organization/product names that may be technologies
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ("ORG", "PRODUCT") and ent.text.lower() in TECH_SKILLS:
            found_skills.add(ent.text.lower())

    return sorted(found_skills)


def detect_experience_years(text):
    """Parse years of experience from resume text."""
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)',
        r'(?:experience|exp)\s*(?:of)?\s*(\d+)\+?\s*(?:years?|yrs?)',
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:in|of|working)',
    ]
    max_years = 0
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        for match in matches:
            years = int(match)
            if years < 50:  # sanity check
                max_years = max(max_years, years)
    return max_years


def detect_education(text):
    """Detect highest education level."""
    text_lower = text.lower()
    max_level = 0
    detected = "Not detected"

    for keyword, level in EDUCATION_LEVELS.items():
        if keyword in text_lower and level > max_level:
            max_level = level
            detected = keyword.title()

    level_names = {0: "Not detected", 1: "High School", 2: "Associate/Diploma",
                   3: "Bachelor's", 4: "Master's", 5: "PhD/Doctorate"}
    return {"level": max_level, "degree": level_names.get(max_level, detected)}


def extract_keywords_from_job(job_desc):
    """Extract important keywords from job description using NLTK + spaCy."""
    # Use spaCy to get non-stop lemmatized tokens
    doc = nlp(job_desc.lower())
    keywords = set()

    for token in doc:
        if (not token.is_stop and not token.is_punct and not token.is_space
                and len(token.text) > 2 and token.pos_ in ("NOUN", "PROPN", "ADJ", "VERB")):
            keywords.add(token.lemma_)

    # Also extract noun chunks
    for chunk in doc.noun_chunks:
        cleaned = chunk.text.strip()
        if len(cleaned) > 2:
            keywords.add(cleaned)

    return sorted(keywords)


def calculate_keyword_match(job_keywords, resume_text):
    """Calculate which job keywords appear in the resume."""
    resume_lower = resume_text.lower()
    matched = []
    missing = []

    for kw in job_keywords:
        if kw.lower() in resume_lower:
            matched.append(kw)
        else:
            missing.append(kw)

    return matched, missing


def get_recommendation(overall_score):
    """Classify the resume match quality."""
    if overall_score >= 0.75:
        return {"label": "Strong Match", "color": "#10b981", "emoji": "🟢"}
    elif overall_score >= 0.55:
        return {"label": "Good Match", "color": "#3b82f6", "emoji": "🔵"}
    elif overall_score >= 0.35:
        return {"label": "Moderate Match", "color": "#f59e0b", "emoji": "🟡"}
    else:
        return {"label": "Weak Match", "color": "#ef4444", "emoji": "🔴"}


def rank_resumes(job_desc, resumes, resume_names=None):
    """Main ranking function with full NLP analysis."""
    start_time = time.time()

    if resume_names is None:
        resume_names = [f"Resume {i+1}" for i in range(len(resumes))]

    # Preprocess texts with spaCy
    job_processed = preprocess_spacy(job_desc)
    resumes_processed = [preprocess_spacy(r) for r in resumes]

    # Extract job keywords
    job_keywords = extract_keywords_from_job(job_desc)
    job_skills = extract_skills(job_desc)

    # Enhanced TF-IDF with bigrams and sublinear TF
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        max_features=5000,
        stop_words='english'
    )
    all_text = [job_processed] + resumes_processed
    tfidf_matrix = vectorizer.fit_transform(all_text)
    job_vector = tfidf_matrix[0]

    results = []
    for i in range(len(resumes)):
        resume_text = resumes[i]

        # 1. TF-IDF cosine similarity
        tfidf_score = cosine_similarity(job_vector, tfidf_matrix[i + 1])[0][0]

        # 2. Skills analysis
        resume_skills = extract_skills(resume_text)
        if job_skills:
            matched_skills = [s for s in resume_skills if s in job_skills]
            skills_score = len(matched_skills) / len(job_skills)
        else:
            matched_skills = resume_skills
            skills_score = min(len(resume_skills) / 10, 1.0) if resume_skills else 0

        # 3. Experience detection
        experience_years = detect_experience_years(resume_text)

        # 4. Education detection
        education = detect_education(resume_text)

        # 5. Keyword matching
        matched_kw, missing_kw = calculate_keyword_match(job_keywords, resume_text)
        keyword_score = len(matched_kw) / len(job_keywords) if job_keywords else 0

        # 6. Weighted overall score
        overall_score = (
            tfidf_score * 0.35 +
            skills_score * 0.30 +
            keyword_score * 0.25 +
            min(education["level"] / 5, 1.0) * 0.10
        )

        # 7. Recommendation
        recommendation = get_recommendation(overall_score)

        results.append({
            "name": resume_names[i] if i < len(resume_names) else f"Resume {i+1}",
            "resume_preview": resume_text[:300] + ("..." if len(resume_text) > 300 else ""),
            "overall_score": round(float(overall_score), 3),
            "scores": {
                "tfidf_similarity": round(float(tfidf_score), 3),
                "skills_match": round(float(skills_score), 3),
                "keyword_match": round(float(keyword_score), 3),
                "education_score": round(float(education["level"] / 5), 3),
            },
            "skills": {
                "found": resume_skills,
                "matched_with_job": matched_skills if job_skills else [],
                "job_requires": job_skills,
            },
            "experience_years": experience_years,
            "education": education,
            "keywords": {
                "matched": matched_kw[:20],
                "missing": missing_kw[:15],
            },
            "recommendation": recommendation,
        })

    # Sort by overall score descending
    results.sort(key=lambda x: x["overall_score"], reverse=True)

    # Add rank
    for i, r in enumerate(results):
        r["rank"] = i + 1

    processing_time = round(time.time() - start_time, 3)

    return {
        "results": results,
        "metadata": {
            "total_resumes": len(resumes),
            "processing_time_seconds": processing_time,
            "job_skills_detected": job_skills,
            "job_keywords_count": len(job_keywords),
            "model_info": "TF-IDF (bigram, sublinear) + spaCy NLP + NLTK"
        }
    }
