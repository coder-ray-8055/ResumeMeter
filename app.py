from flask import Flask, request, jsonify
from flask_cors import CORS
from model import rank_resumes, TECH_SKILLS
import traceback

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "Resume Screening API is running"})


@app.route("/skills", methods=["GET"])
def get_skills():
    """Return the list of recognized skills for frontend autocomplete."""
    return jsonify({"skills": sorted(TECH_SKILLS)})


@app.route("/analyze", methods=["POST"])
def analyze():
    """Analyze and rank resumes against a job description."""
    try:
        data = request.json

        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        job_desc = data.get("job_description", "")
        resumes = data.get("resumes", [])
        resume_names = data.get("resume_names", None)

        if not job_desc or not job_desc.strip():
            return jsonify({"error": "Job description is required"}), 400

        if not resumes or len(resumes) == 0:
            return jsonify({"error": "At least one resume is required"}), 400

        # Filter out empty resumes
        valid_resumes = []
        valid_names = []
        for i, r in enumerate(resumes):
            if r and r.strip():
                valid_resumes.append(r)
                if resume_names and i < len(resume_names):
                    valid_names.append(resume_names[i])
                else:
                    valid_names.append(f"Resume {i+1}")

        if not valid_resumes:
            return jsonify({"error": "All provided resumes are empty"}), 400

        result = rank_resumes(job_desc, valid_resumes, valid_names)
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "An error occurred during analysis",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    print("\n🚀 Resume Screening API starting...")
    print("   Health check: http://127.0.0.1:5000/health")
    print("   Analyze:      POST http://127.0.0.1:5000/analyze")
    print("   Skills list:  http://127.0.0.1:5000/skills\n")
    app.run(debug=True)
