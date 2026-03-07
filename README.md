# AI Talent Acquisition Assistant

An AI-powered recruitment system designed to help HR teams automatically screen resumes and identify the most relevant candidates using semantic similarity.

This project is being developed as a **modular AI system** where different team members are responsible for different components of the recruitment pipeline.

Currently, the **Intelligent Screening Engine** module has been completed.

---

# Project Goal

The goal of this project is to build an **AI Talent Acquisition System** that can assist HR teams in the early stages of hiring by:

- Screening resumes automatically
- Matching candidates to job descriptions using AI
- Ranking candidates based on semantic similarity
- Supporting future modules for candidate engagement and interview scheduling

---

# Current Development Status

This repository currently contains the **Intelligent Screening Engine**, which performs AI-based resume screening.

Modules currently implemented:

- Resume parsing
- Job description parsing
- Embedding generation using Sentence Transformers
- Vector similarity search using ChromaDB
- Candidate ranking based on similarity scores

Other modules (under development):

- Multi-agent orchestration system
- HR dashboard frontend
- Candidate engagement chatbot
- Interview scheduling module

---

# Screening Engine Workflow

The screening engine processes resumes and job descriptions through the following pipeline:

```
Job Description
      ↓
Job Description Parser
      ↓
Resume Parser
      ↓
Embedding Generator
      ↓
Vector Database (ChromaDB)
      ↓
Similarity Search
      ↓
Candidate Ranking
      ↓
Top Candidates
```

---

# Project Structure

```
ai-talent-acquisition-assistant
│
├── api_interface
│   └── screening_service.py
│
├── preprocessing
│   ├── resume_parser.py
│   └── jd_parser.py
│
├── embeddings
│   └── embedding_generator.py
│
├── vector_store
│   └── chroma_store.py
│
├── ranking
│   └── candidate_ranker.py
│
├── data
│   └── resumes
│
├── main.py
├── requirements.txt
└── .gitignore
```

---

# How the Screening Engine Works

1. **Resume Parsing**  
   Resume PDFs are converted into text.

2. **Job Description Processing**  
   The job description is cleaned and prepared for embedding generation.

3. **Embedding Generation**  
   Text is converted into semantic embeddings using the model:

```
all-MiniLM-L6-v2
```

4. **Vector Storage**  
   Resume embeddings are stored in a ChromaDB vector database.

5. **Semantic Search**  
   The job description embedding is compared against stored resume embeddings.

6. **Candidate Ranking**  
   Candidates are ranked based on similarity scores.

---

# Example Output

```
Top Candidates:

1. rahul_resume → Match Score: 0.418
2. priya_resume → Match Score: 0.405
```

Higher scores indicate stronger similarity between the candidate's resume and the job description.

---

# Installation

Clone the repository:

```
git clone https://github.com/subhamsoni858/ai-talent-acquisition-assistant.git
```

Navigate to the project folder:

```
cd ai-talent-acquisition-assistant
```

Install dependencies:

```
pip install -r requirements.txt
```

---

# Running the Screening Engine

Run the following command:

```
python main.py
```

The system will:

- Load resumes
- Generate embeddings
- Perform semantic search
- Rank candidates

---

# Technologies Used

- Python
- Sentence Transformers
- HuggingFace Models
- ChromaDB (Vector Database)

---

# Team Roles

| Member | Responsibility |
|------|------|
| Member 1 | Intelligent Screening Engine |
| Member 2 | Multi-Agent Orchestration |
| Member 3 | HR Dashboard Frontend |
| Member 4 | Candidate Engagement and Scheduling |

---

# License

This project is developed for educational purposes.
