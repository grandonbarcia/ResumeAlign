# ResumeAlign - Implementation Plan

## 📋 Overview

This document outlines the implementation roadmap for the ResumeAlign application. Use this as a reference for development progress and context.

---

## Phase 1: Project Foundation

| Task | Description                                                                                  | Status |
| ---- | -------------------------------------------------------------------------------------------- | ------ |
| 1.1  | Install dependencies: `shadcn/ui`, `openai`, `pdf-parse`, `mammoth` (DOCX)                   | ✅     |
| 1.2  | Set up local app persistence                                                                 | ✅     |
| 1.3  | Define storage model for resumes, jobs, and tailored results                                 | ✅     |
| 1.4  | Create folder structure: `/lib`, `/prompts`, `/app/dashboard`, `/app/upload`, `/app/results` | ✅     |

---

## Phase 2: Resume Upload & Parsing

| Task | Description                                                                      | Status |
| ---- | -------------------------------------------------------------------------------- | ------ |
| 2.1  | Build upload UI with drag-and-drop (PDF, DOCX, TXT)                              | ✅     |
| 2.2  | Create `resumeParser.ts` — extract text from PDF/DOCX                            | ✅     |
| 2.3  | AI-powered resume structuring into JSON (contact, experience, education, skills) | ✅     |
| 2.4  | Store parsed resume locally                                                      | ✅     |

---

## Phase 3: Job URL Extraction

| Task | Description                                                           | Status |
| ---- | --------------------------------------------------------------------- | ------ |
| 3.1  | Build job URL input component                                         | ✅     |
| 3.2  | Create `jobExtractor.ts` — fetch and extract job description from URL | ✅     |
| 3.3  | AI-powered job structuring (requirements, responsibilities, keywords) | ✅     |
| 3.4  | Store structured job data locally                                     | ✅     |

---

## Phase 4: Multi-Step AI Pipeline

| Task | Description                                                               | Status |
| ---- | ------------------------------------------------------------------------- | ------ |
| 4.1  | **Step 1**: Job Description Structuring prompt (`structureJob.ts`)        | ✅     |
| 4.2  | **Step 2**: Resume vs Job Gap Analysis prompt (`gapAnalysis.ts`)          | ✅     |
| 4.3  | **Step 3**: Bullet-Level Resume Rewriting prompt (`bulletRewrite.ts`)     | ✅     |
| 4.4  | **Step 4**: Skills Optimization & Reordering prompt (`skillsOptimize.ts`) | ✅     |
| 4.5  | **Step 5**: Final Resume Assembly                                         | ✅     |
| 4.6  | Create `aiPipeline.ts` to orchestrate all steps                           | ✅     |

---

## Phase 5: Results & Diff View

| Task | Description                                     | Status |
| ---- | ----------------------------------------------- | ------ |
| 5.1  | Build results page with tailored resume display | ✅     |
| 5.2  | Create diff view component (before vs after)    | ✅     |
| 5.3  | Show change explanations per bullet point       | ✅     |
| 5.4  | Display skills changes with reasoning           | ✅     |

---

## Phase 6: Export

| Task | Description                                      | Status |
| ---- | ------------------------------------------------ | ------ |
| 6.1  | PDF export with ATS-friendly formatting          | ✅     |
| 6.2  | DOCX export using `docx` library                 | ✅     |
| 6.3  | Ensure no tables, columns, or graphics in output | ✅     |

---

## Phase 7: Polish & Safety

| Task | Description                                        | Status |
| ---- | -------------------------------------------------- | ------ |
| 7.1  | Add hallucination prevention guardrails in prompts | ✅     |
| 7.2  | Validate AI outputs against original resume        | ✅     |
| 7.3  | Add loading states and error handling              | ✅     |
| 7.4  | Mobile responsive design                           | ✅     |

---

## 🗂️ Target File Structure

```
/app
  /dashboard        → User's saved resumes & history
  /upload           → Resume upload + job URL input
  /results/[id]     → Tailored resume results + diff view
  /api
    /parse-resume   → Resume parsing endpoint
    /extract-job    → Job extraction endpoint
    /tailor         → AI pipeline endpoint
/lib
  resumeParser.ts   → PDF/DOCX text extraction
  jobExtractor.ts   → URL scraping & text extraction
  aiPipeline.ts     → Multi-step AI orchestration
  exportResume.ts   → PDF/DOCX generation
/prompts
  structureJob.ts   → Job description structuring
  gapAnalysis.ts    → Resume vs job gap analysis
  bulletRewrite.ts  → Bullet-level rewriting
  skillsOptimize.ts → Skills optimization
/components
  ResumeUploader.tsx
  JobUrlInput.tsx
  DiffView.tsx
  ResumePreview.tsx
```

---

## 🎯 MVP Priority Order

1. **Resume upload + parsing** (core functionality)
2. **Job URL extraction** (core functionality)
3. **AI gap analysis + rewriting** (core value)
4. **Diff view** (user trust & transparency)
5. **PDF export** (deliverable output)
6. **Auth + storage** (persistence)

---

## 🔐 AI Safety Constraints

The AI prompts must enforce:

- ❌ Never invent experience
- ❌ Never add companies, roles, or degrees
- ❌ Never exaggerate achievements
- ✅ Only rewrite and reorder existing content

---

## 📄 ATS Output Rules

- No tables or columns
- No icons or graphics
- Simple headings
- Standard fonts
- Keyword-optimized language

---

## 📝 Progress Log

| Date       | Task Completed                                          | Notes                                                               |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| 2026-01-28 | Phase 4 pipeline + /api/tailor + results page (initial) | Added prompts, orchestration, stored runs, and results UI.          |
| 2026-01-28 | Phase 5 skills diff + rationale                         | Show original vs optimized skills, movement, and reasoning.         |
| 2026-01-28 | Phase 6 export (PDF + DOCX)                             | Added server export routes and results page download buttons.       |
| 2026-01-28 | Mock AI fallback mode                                   | App runs without `OPENAI_API_KEY` via heuristic mock provider.      |
| 2026-01-28 | Safety validations & guardrails                         | Enforced no-invention rules (skills subset, bullet rewrite checks). |
| 2026-01-28 | UI polish (Phase 7.3/7.4 started)                       | Standardized alerts + improved small-screen layouts and wrapping.   |

---

## Legend

- ⬜ Not started
- 🔄 In progress
- ✅ Complete
