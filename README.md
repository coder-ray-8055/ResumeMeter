# 🚀 AI Resume Screening & Ranking System

An intelligent, NLP-powered resume screening tool that automatically analyzes and ranks candidate resumes against job descriptions using **spaCy**, **NLTK**, and **scikit-learn**. Features a modern dark-themed React dashboard with real-time scoring, skill extraction, and detailed candidate insights.

---

## ✨ Features

### 🧠 ML / NLP Backend
- **TF-IDF + Cosine Similarity** — bigram-enabled, sublinear TF vectorization for semantic matching
- **spaCy NLP Pipeline** — lemmatization, stop-word removal, Named Entity Recognition (NER), noun-chunk extraction
- **NLTK Integration** — sentence/word tokenization, POS tagging for keyword extraction
- **Skill Extraction** — matches against 100+ curated skills (programming languages, frameworks, ML/AI, cloud, databases, soft skills)
- **Experience Detection** — regex-based parsing of years of experience from resume text
- **Education Detection** — identifies degree levels (PhD → Master's → Bachelor's → Associate → High School)
- **Section-wise Scoring** — weighted composite: TF-IDF (35%) + Skills Match (30%) + Keyword Match (25%) + Education (10%)
- **Recommendation Labels** — auto-classifies candidates as 🟢 Strong Match / 🔵 Good Match / 🟡 Moderate Match / 🔴 Weak Match

### 🎨 Frontend Dashboard
- **Dark Glassmorphism UI** — animated gradient backgrounds, frosted-glass cards, micro-animations
- **Preset Job Templates** — one-click templates for Frontend Dev, Backend Dev, Data Scientist, Full Stack, DevOps, ML Engineer
- **Multi-Resume Input** — add/remove named candidates dynamically
- **Results Dashboard** — circular score indicators, rank medals (🥇🥈🥉), category breakdown bars
- **Keyword Analysis** — visual chips showing matched ✅ and missing ❌ keywords
- **Skill Tags** — detected skills highlighted with job-match indicators
- **Top Candidate Spotlight** — featured section for the best match
- **Stats Summary** — resumes analyzed, average score, skills detected, processing time
- **Expandable Previews** — toggle resume text previews per candidate
- **Error Handling** — toast notifications, loading spinners with NLP progress text

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **NLP / ML** | spaCy, NLTK, scikit-learn (TF-IDF, cosine similarity) |
| **Backend** | Python, Flask, Flask-CORS |
| **Frontend** | React 19, Framer Motion, Axios |
| **Styling** | Vanilla CSS (glassmorphism, CSS custom properties, keyframe animations) |

---

## 📁 Project Structure

```
resume screening/
├── backend/
│   ├── app.py          # Flask API server (endpoints: /analyze, /health, /skills)
│   └── model.py        # NLP pipeline (spaCy + NLTK + scikit-learn)
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js      # Main React app (input panels, results dashboard)
│   │   ├── App.css     # Dark glassmorphism styles & animations
│   │   ├── index.js    # React entry point
│   │   └── index.css   # Global reset & CSS variables
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** — [Download Python](https://www.python.org/downloads/)
- **Node.js 16+** — [Download Node.js](https://nodejs.org/)
- **pip** (comes with Python)
- **npm** (comes with Node.js)

---

### 1️⃣ Setup the Backend

Open a terminal and navigate to the backend folder:

```bash
cd backend
```

**Install Python dependencies:**

```bash
pip install flask flask-cors spacy nltk scikit-learn
```

**Download the spaCy English model:**

```bash
python -m spacy download en_core_web_sm
```

**Start the Flask server:**

```bash
python app.py
```

You should see:

```
🚀 Resume Screening API starting...
   Health check: http://127.0.0.1:5000/health
   Analyze:      POST http://127.0.0.1:5000/analyze
   Skills list:  http://127.0.0.1:5000/skills
```

> ✅ Keep this terminal open — the backend must be running for the frontend to work.

---

### 2️⃣ Setup the Frontend

Open a **new/second terminal** and navigate to the frontend folder:

```bash
cd frontend
```

**Install Node.js dependencies:**

```bash
npm install
```

**Start the React development server:**

```bash
npm start
```

The app will automatically open in your browser at **http://localhost:3000**.

> ⚠️ The first compilation may take 1–2 minutes. Subsequent reloads are instant.

---

## 📖 How to Use

1. **Select a Job Role** (optional) — choose a preset template from the dropdown (e.g., "Frontend Developer") or write your own job description
2. **Enter Resumes** — paste candidate resume text into the input cards. Click **"+ Add Another Resume"** to add more candidates. Give each candidate a name.
3. **Click "Analyze & Rank Resumes"** — the system processes all resumes through the NLP pipeline
4. **View Results** — the dashboard displays:
   - **Stats Bar** — total resumes, average score, skills detected, processing time
   - **Top Candidate** — highlighted best match
   - **Ranked Cards** — each candidate shows:
     - Overall score with circular progress indicator
     - Recommendation badge (Strong / Good / Moderate / Weak)
     - Score breakdown bars (TF-IDF, Skills, Keywords, Education)
     - Detected skills with match indicators
     - Matched and missing keywords
     - Expandable resume preview

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check — returns `{ "status": "ok" }` |
| `GET` | `/skills` | Returns the full list of 100+ recognized skills |
| `POST` | `/analyze` | Analyzes and ranks resumes against a job description |

### POST `/analyze` — Request Body

```json
{
  "job_description": "Looking for a React developer with 3+ years experience...",
  "resumes": [
    "John Smith — 3 years React experience, BS in CS...",
    "Jane Doe — 5 years full stack Python/Django, MS in AI..."
  ],
  "resume_names": ["John Smith", "Jane Doe"]
}
```

### Response

```json
{
  "results": [
    {
      "rank": 1,
      "name": "John Smith",
      "overall_score": 0.72,
      "scores": {
        "tfidf_similarity": 0.65,
        "skills_match": 0.80,
        "keyword_match": 0.70,
        "education_score": 0.60
      },
      "skills": { "found": ["react", "javascript", "css"], "matched_with_job": ["react"] },
      "experience_years": 3,
      "education": { "level": 3, "degree": "Bachelor's" },
      "keywords": { "matched": ["react", "experience"], "missing": ["redux"] },
      "recommendation": { "label": "Good Match", "color": "#3b82f6", "emoji": "🔵" }
    }
  ],
  "metadata": {
    "total_resumes": 2,
    "processing_time_seconds": 0.174,
    "job_skills_detected": ["react", "javascript"],
    "model_info": "TF-IDF (bigram, sublinear) + spaCy NLP + NLTK"
  }
}
```

---

## 🧪 Scoring Algorithm

The overall score is a **weighted composite** of four categories:

| Category | Weight | How It Works |
|----------|--------|--------------|
| **TF-IDF Similarity** | 35% | Cosine similarity between job description and resume TF-IDF vectors (bigram, sublinear TF) |
| **Skills Match** | 30% | Ratio of job-required skills found in resume (from 100+ curated skill list) |
| **Keyword Match** | 25% | Ratio of job description keywords (nouns, verbs, noun chunks) found in resume |
| **Education** | 10% | Numeric score based on highest detected degree level (PhD=5, Master's=4, Bachelor's=3, etc.) |

**Recommendation thresholds:**
- 🟢 **Strong Match** — score ≥ 75%
- 🔵 **Good Match** — score ≥ 55%
- 🟡 **Moderate Match** — score ≥ 35%
- 🔴 **Weak Match** — score < 35%

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ using <b>spaCy</b> + <b>NLTK</b> + <b>scikit-learn</b> + <b>React</b>
</p>
