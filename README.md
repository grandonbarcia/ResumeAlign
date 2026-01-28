# ResumeAlign

An AI-powered web application that customizes a user's resume for a specific job application by analyzing the job posting URL and safely tailoring resume content for maximum relevance and ATS compatibility.

This project is designed as a **real-world, production-style AI app** and a **strong portfolio piece** for frontend and full-stack roles.

---

## 🚀 What This App Does

1. Users upload their resume (PDF, DOCX, or text)
2. Users paste a job application URL
3. The app extracts and analyzes the job description
4. AI tailors the resume to match the job requirements
5. Users receive:
   - A tailored resume
   - A clear explanation of changes
   - An ATS-friendly downloadable file

---

## ✨ Key Features

- Resume parsing into structured data (JSON)
- Job description extraction from live URLs
- Multi-step AI pipeline (no single-prompt magic)
- ATS-safe resume optimization
- Resume diff view (before vs after)
- PDF / DOCX export
- Strict hallucination prevention (no fake experience)

---

## 🧠 AI Design Philosophy

This app intentionally avoids a single "rewrite my resume" prompt.

Instead, it uses a **controlled, multi-step pipeline**:

1. **Job Description Structuring**
2. **Resume vs Job Gap Analysis**
3. **Bullet-Level Resume Rewriting**
4. **Skills Optimization & Reordering**
5. **Final Resume Assembly**

This approach improves accuracy, reduces hallucinations, and mirrors real production AI systems.

---

## 🛠️ Tech Stack

### Frontend

- Next.js (App Router)
- Tailwind CSS
- shadcn/ui

### Backend

- Next.js Server Actions / API Routes
- Resume parsing utilities (PDF & DOCX)

### AI

- OpenAI API (structured JSON outputs)
- Prompt chaining with strict constraints

### Auth & Data (Optional)

- Clerk (authentication)
- Convex or Supabase (storage & versioning)

---

## 📂 Project Structure (Example)

```
/app
  /dashboard
  /upload
  /results
/lib
  resumeParser.ts
  jobExtractor.ts
  aiPipeline.ts
/prompts
  gapAnalysis.ts
  bulletRewrite.ts
  skillsOptimize.ts
```

---

## 🔐 Safety & Trust Guarantees

The AI is explicitly constrained to:

- ❌ Never invent experience
- ❌ Never add companies, roles, or degrees
- ❌ Never exaggerate achievements
- ✅ Only rewrite and reorder existing content

All changes are traceable and visible to the user.

---

## 📄 ATS-Friendly Output Rules

- No tables or columns
- No icons or graphics
- Simple headings
- Standard fonts
- Keyword-optimized language

These rules ensure compatibility with common Applicant Tracking Systems.

---

## 🧪 Example AI Output (Simplified)

```json
{
  "changed_bullets": [
    {
      "original": "Built UI components",
      "updated": "Built reusable UI components using React and Tailwind CSS",
      "reason": "Matches required skills in job posting"
    }
  ]
}
```

---

## 🧭 MVP Build Roadmap

1. Resume upload & parsing
2. Job URL text extraction
3. AI gap analysis
4. Resume bullet rewriting
5. Diff & explanation view
6. Export to PDF / DOCX

---

## 📈 Future Enhancements

- ATS match score
- Cover letter generation
- Multiple resume versions per job
- LinkedIn profile optimization
- Recruiter-style resume preview

---

## 💼 Why This Project Matters

This app demonstrates:

- Real-world AI product thinking
- Safe LLM orchestration
- Frontend UX for complex workflows
- Resume-worthy full-stack architecture

> This is not a toy app — it is designed the way production AI systems are actually built.

---

## 📜 License

MIT License

---

## 🙌 Acknowledgements

Built as a portfolio project to demonstrate applied AI, frontend engineering, and thoughtful product design.
