import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import "./App.css";

// ─── Preset Job Templates ───
const JOB_PRESETS = {
  "": "",
  "Frontend Developer": `We are looking for a skilled Frontend Developer with experience in React, JavaScript, HTML, CSS, and modern web technologies. The ideal candidate has 2+ years of experience building responsive web applications, knowledge of state management (Redux/Context API), REST APIs, Git version control, and strong problem-solving skills. Experience with TypeScript, Next.js, and unit testing is a plus.`,
  "Backend Developer": `Seeking a Backend Developer proficient in Python, Node.js, or Java. Must have experience with REST API design, database management (SQL/NoSQL), cloud services (AWS/GCP/Azure), Docker, and CI/CD pipelines. 3+ years of experience required. Knowledge of microservices architecture, message queues, and caching strategies preferred.`,
  "Data Scientist": `Looking for a Data Scientist with strong skills in Python, machine learning, deep learning, statistics, and data visualization. Must be proficient with pandas, NumPy, scikit-learn, TensorFlow or PyTorch. Experience with NLP, computer vision, or recommendation systems is a plus. Master's degree in CS, Statistics, or related field preferred. 2+ years of experience.`,
  "Full Stack Developer": `Full Stack Developer needed with expertise in React/Angular frontend and Node.js/Python backend. Must have experience with MongoDB/PostgreSQL databases, REST/GraphQL APIs, Docker, Git, and agile development. 3+ years of full stack experience. AWS/cloud deployment experience required.`,
  "DevOps Engineer": `DevOps Engineer with strong experience in CI/CD pipelines, Docker, Kubernetes, Terraform, and cloud platforms (AWS/Azure/GCP). Must have solid Linux administration skills, scripting in Bash/Python, and experience with monitoring tools (Prometheus, Grafana). Infrastructure as Code and GitOps experience preferred. 3+ years.`,
  "ML Engineer": `Machine Learning Engineer with expertise in building production ML systems. Proficient in Python, TensorFlow/PyTorch, scikit-learn, data pipelines, and model deployment. Experience with MLOps, feature engineering, and A/B testing. Strong understanding of deep learning, NLP, and computer vision. Master's or PhD preferred. 2+ years of experience.`,
};

// ─── Score Circle Component ───
function ScoreCircle({ score, color = "#6366f1", size = 64 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;

  return (
    <div className="score-circle" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="bg-ring" cx={size/2} cy={size/2} r={radius} />
        <circle
          className="progress-ring"
          cx={size/2} cy={size/2} r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="score-value">{Math.round(score * 100)}%</span>
    </div>
  );
}

// ─── Breakdown Bar Component ───
function BreakdownBar({ label, value, color }) {
  return (
    <div className="breakdown-item">
      <div className="breakdown-label">
        <span>{label}</span>
        <span style={{ color }}>{Math.round(value * 100)}%</span>
      </div>
      <div className="breakdown-bar">
        <div
          className="breakdown-fill"
          style={{ width: `${value * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Result Card Component ───
function ResultCard({ result }) {
  const [showPreview, setShowPreview] = useState(false);
  const rankClass = result.rank <= 3 ? `rank-${result.rank}` : "";
  const scoreColor =
    result.overall_score >= 0.75 ? "#10b981" :
    result.overall_score >= 0.55 ? "#3b82f6" :
    result.overall_score >= 0.35 ? "#f59e0b" : "#ef4444";

  return (
    <div className={`result-card ${rankClass}`}>
      {/* Header */}
      <div className="card-header">
        <div className="card-left">
          <div className={`rank-badge ${result.rank > 3 ? 'rank-other' : ''}`}>
            {result.rank <= 3 ? ["🥇","🥈","🥉"][result.rank - 1] : `#${result.rank}`}
          </div>
          <div className="candidate-info">
            <h3>{result.name}</h3>
            <div className="candidate-meta">
              <span>📅 {result.experience_years > 0 ? `${result.experience_years} yrs exp` : "Exp N/A"}</span>
              <span>🎓 {result.education.degree}</span>
              <span>🛠 {result.skills.found.length} skills</span>
            </div>
          </div>
        </div>
        <div className="card-right">
          <ScoreCircle score={result.overall_score} color={scoreColor} />
          <div
            className="recommendation-badge"
            style={{
              background: `${result.recommendation.color}18`,
              color: result.recommendation.color,
              border: `1px solid ${result.recommendation.color}40`,
            }}
          >
            {result.recommendation.emoji} {result.recommendation.label}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        {/* Score Breakdown */}
        <div className="score-breakdown">
          <BreakdownBar label="📊 TF-IDF Similarity" value={result.scores.tfidf_similarity} color="#6366f1" />
          <BreakdownBar label="🛠 Skills Match" value={result.scores.skills_match} color="#06b6d4" />
          <BreakdownBar label="🔑 Keyword Match" value={result.scores.keyword_match} color="#8b5cf6" />
          <BreakdownBar label="🎓 Education" value={result.scores.education_score} color="#10b981" />
        </div>

        {/* Skills */}
        {result.skills.found.length > 0 && (
          <div className="skills-section">
            <div className="keywords-label">🛠 Skills Detected ({result.skills.found.length})</div>
            <div className="keyword-tags">
              {result.skills.found.map((skill, i) => (
                <span
                  key={i}
                  className={`keyword-tag ${result.skills.matched_with_job.includes(skill) ? 'matched' : 'skill'}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Matched Keywords */}
        {result.keywords.matched.length > 0 && (
          <div className="keywords-section">
            <div className="keywords-label">✅ Matched Keywords ({result.keywords.matched.length})</div>
            <div className="keyword-tags">
              {result.keywords.matched.map((kw, i) => (
                <span key={i} className="keyword-tag matched">{kw}</span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Keywords */}
        {result.keywords.missing.length > 0 && (
          <div className="keywords-section">
            <div className="keywords-label">❌ Missing Keywords ({result.keywords.missing.length})</div>
            <div className="keyword-tags">
              {result.keywords.missing.map((kw, i) => (
                <span key={i} className="keyword-tag missing">{kw}</span>
              ))}
            </div>
          </div>
        )}

        {/* Resume Preview */}
        <button
          className="preview-toggle"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "▾" : "▸"} {showPreview ? "Hide" : "Show"} Resume Preview
        </button>
        {showPreview && (
          <div className="preview-content">
            {result.resume_preview}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  Main App
// ═══════════════════════════════════════════
function App() {
  const [jobDesc, setJobDesc] = useState("");
  const [resumes, setResumes] = useState([
    { name: "Candidate 1", text: "" },
  ]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Resume Management ───
  const addResume = () => {
    setResumes(prev => [...prev, { name: `Candidate ${prev.length + 1}`, text: "" }]);
  };

  const removeResume = (index) => {
    if (resumes.length > 1) {
      setResumes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateResume = (index, field, value) => {
    setResumes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ─── Handle Preset ───
  const handlePresetChange = (e) => {
    const preset = e.target.value;
    if (JOB_PRESETS[preset]) {
      setJobDesc(JOB_PRESETS[preset]);
    }
  };

  // ─── Analyze ───
  const handleAnalyze = useCallback(async () => {
    if (!jobDesc.trim()) {
      setError("Please enter a job description");
      setTimeout(() => setError(""), 4000);
      return;
    }

    const validResumes = resumes.filter(r => r.text.trim());
    if (validResumes.length === 0) {
      setError("Please enter at least one resume");
      setTimeout(() => setError(""), 4000);
      return;
    }

    setLoading(true);
    setResults(null);
    setError("");

    try {
      const response = await axios.post("http://127.0.0.1:5000/analyze", {
        job_description: jobDesc,
        resumes: validResumes.map(r => r.text),
        resume_names: validResumes.map(r => r.name || "Unnamed"),
      });

      setResults(response.data);
    } catch (err) {
      console.error("Error:", err);
      const msg = err.response?.data?.error || "Could not connect to the backend. Make sure the Flask server is running on port 5000.";
      setError(msg);
      setTimeout(() => setError(""), 6000);
    } finally {
      setLoading(false);
    }
  }, [jobDesc, resumes]);

  // ─── Computed Stats ───
  const avgScore = results
    ? (results.results.reduce((sum, r) => sum + r.overall_score, 0) / results.results.length)
    : 0;

  return (
    <div className="app-wrapper">
      <div className="app-content">
        {/* ─── Hero Header ─── */}
        <header className="hero-header">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            AI-Powered Analysis
          </div>
          <h1 className="hero-title">Resume Screening System</h1>
          <p className="hero-subtitle">
            Intelligent NLP-powered resume ranking — match candidates to job roles with
            skill extraction, keyword analysis, and ML-driven scoring.
          </p>
        </header>

        {/* ─── Input Panels ─── */}
        <div className="input-grid">
          {/* Job Description */}
          <div className="glass-card">
            <div className="section-title">
              <span className="icon">💼</span>
              Job Description
            </div>
            <select className="preset-select" onChange={handlePresetChange} defaultValue="">
              <option value="">— Select a preset job role —</option>
              {Object.keys(JOB_PRESETS).filter(k => k).map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
            <textarea
              className="styled-textarea"
              placeholder="Paste the full job description here, including required skills, experience level, and qualifications..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
            <div className="textarea-footer">
              <span>{jobDesc.length} characters</span>
              <span>{jobDesc.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>

          {/* Resumes */}
          <div className="glass-card">
            <div className="section-title">
              <span className="icon">📄</span>
              Resumes
            </div>
            <div style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
              <AnimatePresence>
                {resumes.map((resume, index) => (
                  <motion.div
                    key={index}
                    className="resume-entry"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="resume-entry-header">
                      <input
                        className="resume-name-input"
                        value={resume.name}
                        onChange={(e) => updateResume(index, "name", e.target.value)}
                        placeholder="Candidate name"
                      />
                      {resumes.length > 1 && (
                        <button className="btn-remove" onClick={() => removeResume(index)}>
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      className="resume-textarea"
                      placeholder={`Paste resume content for ${resume.name}...`}
                      value={resume.text}
                      onChange={(e) => updateResume(index, "text", e.target.value)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button className="btn-add-resume" onClick={addResume}>
              + Add Another Resume
            </button>
          </div>
        </div>

        {/* ─── Analyze Button ─── */}
        <div className="analyze-section">
          <button
            className="btn-analyze"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                Processing...
              </>
            ) : (
              <>🔍 Analyze & Rank Resumes</>
            )}
          </button>
        </div>

        {/* ─── Loading State ─── */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <div className="loading-text">Analyzing resumes with NLP...</div>
            <div className="loading-subtext">
              Running spaCy NER • Extracting skills • Computing TF-IDF similarity
            </div>
          </div>
        )}

        {/* ─── Results ─── */}
        {results && !loading && (
          <div className="results-section">
            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-value">{results.metadata.total_resumes}</div>
                <div className="stat-label">Resumes Analyzed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{Math.round(avgScore * 100)}%</div>
                <div className="stat-label">Average Score</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{results.metadata.job_skills_detected.length}</div>
                <div className="stat-label">Job Skills Detected</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{results.metadata.processing_time_seconds}s</div>
                <div className="stat-label">Processing Time</div>
              </div>
            </div>

            {/* Top Candidate Highlight */}
            {results.results.length > 0 && (
              <motion.div
                className="glass-card"
                style={{
                  marginBottom: "24px",
                  borderColor: "rgba(245, 158, 11, 0.3)",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.05), rgba(99,102,241,0.05))",
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap"
                }}>
                  <span style={{ fontSize: "2.5rem" }}>🏆</span>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>
                      Top Candidate
                    </div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f59e0b" }}>
                      {results.results[0].name}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      Overall Score: {Math.round(results.results[0].overall_score * 100)}% •{" "}
                      {results.results[0].skills.found.length} skills detected •{" "}
                      {results.results[0].recommendation.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Result Cards */}
            <div className="results-title">
              📊 Detailed Rankings
            </div>
            {results.results.map((result, index) => (
              <ResultCard key={index} result={result} />
            ))}

            {/* Model Info */}
            <div className="app-footer">
              Powered by <span>spaCy</span> + <span>NLTK</span> + <span>scikit-learn</span> •{" "}
              {results.metadata.model_info}
            </div>
          </div>
        )}

        {/* ─── Empty State ─── */}
        {!results && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Ready to analyze resumes</h3>
            <p>Enter a job description and paste candidate resumes above, then click "Analyze & Rank" to see intelligent ML-powered rankings.</p>
          </div>
        )}

        {/* ─── Error Toast ─── */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="toast"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3 }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
