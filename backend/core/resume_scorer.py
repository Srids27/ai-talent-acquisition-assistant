"""
Groq-Based Resume Scorer — replaces the heavy sentence-transformers + sklearn pipeline
with Groq (Llama 3.3-70B) to compute resume-JD similarity scores.

This achieves the SAME goal as the original ML pipeline:
  - Compares resume text against job description
  - Returns a similarity/match score (0-100)
  - Provides an explanation of the match

Instead of:
  sentence-transformers (all-MiniLM-L6-v2) → embeddings → cosine similarity
We now use:
  Groq LLM → semantic analysis → structured scoring

Benefits:
  - Zero heavy dependencies (no PyTorch, no sklearn)
  - Works on Render free tier
  - More explainable scoring (LLM provides reasoning)
  - Still uses semantic understanding (LLM comprehends meaning, not just keywords)
"""
import json
import re
import os
from groq import AsyncGroq
from core.config import settings


# Lazy Groq client — reuses the same pattern as ai_engine.py
_client = None


def _get_client() -> AsyncGroq:
    """Return a configured Groq async client."""
    global _client
    if _client is None:
        api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _client = AsyncGroq(api_key=api_key)
    return _client


# Default JD used when no specific JD is provided
DEFAULT_JD = """
We are looking for a talented software engineer with strong programming skills.
The ideal candidate has experience in Python, JavaScript, web development,
machine learning, data structures, algorithms, REST APIs, databases (SQL/NoSQL),
cloud platforms (AWS/GCP/Azure), version control (Git), and agile methodologies.
Strong communication skills, problem-solving ability, teamwork, and a passion
for technology are essential. Experience with React, Node.js, FastAPI, Docker,
Kubernetes, CI/CD pipelines, and system design is a plus.
"""


async def score_resume_ml(resume_text: str, job_description: str = None) -> dict:
    """
    Score a resume against a job description using Groq LLM semantic analysis.

    This replaces the original cosine-similarity pipeline with an LLM-based scorer
    that provides the same output format:
      - similarity_score: 0.0 to 1.0 (analogous to cosine similarity)
      - match_score: 0 to 100 (scaled score)
      - explanation: human-readable breakdown

    The LLM evaluates:
      1. Skills overlap (technical skills match)
      2. Experience relevance (domain and years)
      3. Education fit
      4. Overall semantic alignment between resume and JD
    """
    if not resume_text or len(resume_text.strip()) < 50:
        return {
            "similarity_score": 0.0,
            "match_score": 0,
            "explanation": "Resume text too short or empty for analysis."
        }

    jd_text = job_description or DEFAULT_JD

    prompt = f"""You are a resume-to-job-description matching engine. Your task is to compute a similarity score between a candidate's resume and a job description, similar to how cosine similarity works on text embeddings.

SCORING CRITERIA (evaluate each independently):
1. **Skills Match** (0-10): How many required/preferred skills from the JD appear in the resume?
2. **Experience Relevance** (0-10): Does the candidate's work experience align with the role?
3. **Education Fit** (0-10): Does their education background match the requirements?
4. **Domain Alignment** (0-10): Overall semantic similarity between resume content and JD intent.

SCORING GUIDELINES:
- 0-2: Almost no overlap, completely different field
- 3-4: Minimal overlap, a few transferable skills
- 5-6: Moderate match, some relevant skills/experience but gaps exist
- 7-8: Strong match, most requirements met with relevant experience
- 9-10: Excellent match, nearly perfect alignment

IMPORTANT: Be honest and precise. A fresh graduate applying for a senior role should get 3-5, not 7-8.

Job Description:
\"\"\"
{jd_text[:2000]}
\"\"\"

Resume:
\"\"\"
{resume_text[:3000]}
\"\"\"

Return ONLY valid JSON:
{{
  "skills_match": <0-10>,
  "experience_relevance": <0-10>,
  "education_fit": <0-10>,
  "domain_alignment": <0-10>,
  "overall_score": <0-100, computed as weighted average: skills_match*30 + experience_relevance*30 + education_fit*15 + domain_alignment*25, divided by 10>,
  "explanation": "<one sentence explaining the match quality>"
}}"""

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,  # Lower temp for more consistent scoring
            max_tokens=512,
        )
        text = response.choices[0].message.content.strip()

        # Parse JSON (handle markdown fences)
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()

        try:
            result = json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r'(\{[\s\S]*\})', text)
            if match:
                result = json.loads(match.group(1))
            else:
                raise

        overall = result.get("overall_score", 50)
        overall = min(100, max(0, float(overall)))
        similarity = round(overall / 100, 4)

        explanation = result.get("explanation", "")
        skills = result.get("skills_match", 5)
        exp = result.get("experience_relevance", 5)
        edu = result.get("education_fit", 5)
        domain = result.get("domain_alignment", 5)

        detailed_explanation = (
            f"{explanation} "
            f"[Skills: {skills}/10, Experience: {exp}/10, "
            f"Education: {edu}/10, Domain: {domain}/10] "
            f"(Groq/Llama 3.3 semantic analysis)"
        )

        print(f"[ML-Groq] Resume score: {overall}/100 (sim: {similarity})")

        return {
            "similarity_score": similarity,
            "match_score": round(overall, 1),
            "explanation": detailed_explanation
        }

    except Exception as e:
        print(f"[ML-Groq] Scoring error: {e}")
        # Fallback: keyword-based scoring (never returns default 50)
        return _keyword_fallback_score(resume_text, jd_text)


def _keyword_fallback_score(resume_text: str, jd_text: str) -> dict:
    """
    Lightweight keyword-overlap fallback if Groq is unavailable.
    Still gives a real score based on actual text analysis.
    """
    SKILLS = [
        "python", "java", "javascript", "typescript", "c++", "c#", "rust", "ruby", "php",
        "react", "angular", "vue", "next.js", "node.js", "express", "django", "flask", "fastapi",
        "html", "css", "tailwind", "bootstrap",
        "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "firebase",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "ci/cd",
        "git", "github", "gitlab",
        "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
        "machine learning", "deep learning", "nlp", "computer vision", "data science",
        "rest api", "graphql", "microservices", "system design",
        "linux", "agile", "scrum",
        "power bi", "tableau", "excel",
        "communication", "leadership", "teamwork", "problem solving",
    ]

    resume_lower = resume_text.lower()
    jd_lower = jd_text.lower()

    jd_skills = [s for s in SKILLS if s in jd_lower]
    if not jd_skills:
        jd_skills = SKILLS[:20]  # use common skills if JD is generic

    matched = [s for s in jd_skills if s in resume_lower]
    overlap = len(matched) / max(len(jd_skills), 1)

    score = min(100, max(5, round(overlap * 100, 1)))

    return {
        "similarity_score": round(overlap, 4),
        "match_score": score,
        "explanation": f"Keyword match: {len(matched)}/{len(jd_skills)} skills found ({score}/100). (Fallback scorer — Groq unavailable)"
    }
