# ContextOS — AI-Powered Knowledge & Context Transfer Platform

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-contextos--lilac.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://contextos-lilac.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Qdrant](https://img.shields.io/badge/Qdrant%20Cloud-Vector%20RAG-DC2626?style=for-the-badge&logo=qdrant&logoColor=white)](https://qdrant.tech/)
[![Groq LPU](https://img.shields.io/badge/Groq%20LPU-gpt--oss--20b-F55036?style=for-the-badge&logo=fastapi&logoColor=white)](https://groq.com/)
[![SentenceTransformers](https://img.shields.io/badge/SentenceTransformers-all--MiniLM--L6--v2-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)

**"Everything your team knows. Nothing your team loses."**

*An enterprise-grade, polyglot AI knowledge observability and context-transfer platform engineered to eliminate tribal knowledge loss during developer offboarding, role transitions, and asynchronous cross-functional handovers.*

</div>

---

## 🌐 Live Deployment & Links

* **Production URL:** [https://contextos-lilac.vercel.app/](https://contextos-lilac.vercel.app/)
* **Repository:** [https://github.com/Sonu448866/ContextOS](https://github.com/Sonu448866/ContextOS)
* **Vector Store:** Qdrant Cloud (384-dimensional collection `knowledge`)
* **LLM Engine:** Groq LPU (`openai/gpt-oss-20b`) with resilient multi-tier fallback

---

## 📋 Table of Contents

1. [Product Overview](#1-product-overview)
2. [The Enterprise Pain Point ($ Value)](#2-the-enterprise-pain-point--value)
3. [Polyglot System Architecture](#3-polyglot-system-architecture)
4. [Vector RAG Pipeline & Live Evaluation Triad](#4-vector-rag-pipeline--live-evaluation-triad)
5. [Document Ingestion & Multi-Tier Storage](#5-document-ingestion--multi-tier-storage)
6. [Context Gap & Contradiction Detector](#6-context-gap--contradiction-detector)
7. [Context Transfer Engine (17-Part Handover)](#7-context-transfer-engine-17-part-handover)
8. [Technology Stack](#8-technology-stack)
9. [Repository Structure](#9-repository-structure)
10. [Local Setup Instructions](#10-local-setup-instructions)
11. [Environment Variables Guide](#11-environment-variables-guide)
12. [REST API Endpoints Reference](#12-rest-api-endpoints-reference)
13. [Step-by-Step Demonstration Script](#13-step-by-step-demonstration-script)
14. [Interview Talking Points & Resume Bullets](#14-interview-talking-points--resume-bullets)

---

## 1. Product Overview

ContextOS bridges the gap between static document wikis (Notion, Confluence) and ephemeral task tracking systems (Jira, Linear). While existing issue trackers capture **what** needs to be done, they rarely preserve **why** decisions were made, the architectural trade-offs that constrain them, who previously owned the component, what staging blockers exist, and what an incoming engineer needs to understand on Day 1.

ContextOS ingests unstructured artifacts (PDFs, DOCX, architecture notes, PRDs, incident postmortems), segments them into semantic vector chunks, indexes them into **Qdrant Cloud**, and provides an observable **Semantic RAG Assistant** evaluated in real-time by the **RAG Triad** (Faithfulness, Relevance, and Precision).

---

## 2. The Enterprise Pain Point ($ Value)

| Organizational Challenge | Industry Cost | How ContextOS Solves It |
| :--- | :--- | :--- |
| **Developer Onboarding Lag** | 3 to 6 months ramp-up time costing **$30,000–$50,000+** in lost velocity per new hire. | Instant semantic search across project history with cited sources and uncertainty warnings. |
| **Tacit Knowledge Loss ("The Bus Factor")** | When senior engineers leave, architectural context, staging quirks, and unwritten dependencies vanish. | Automatically compiles **17-part Handover Packages** with export to PDF and Markdown. |
| **Architectural Drift & Contradictions** | Team A assumes Razorpay; Team B builds for Stripe. Contradictions are discovered only during release testing. | The **Context Gap Detector** catches conflicting decisions and unassigned blockers before sprint failure. |
| **Hallucination Risk in Enterprise RAG** | Companies fear LLM hallucinations with zero auditability. | Real-time **RAG Triad Suite** calculates ground-truth faithfulness, precision, and latency for every query. |

---

## 3. Polyglot System Architecture

ContextOS combines a high-concurrency **TypeScript/Node.js orchestration layer** with a **Python deep-learning tensor bridge** for local embedding calculations:

```
                         ┌───────────────────────────────────────────────┐
                         │              ContextOS Client                 │
                         │    (React 18 + Vite + Tailwind + Obsidian UI) │
                         └──────────────────────┬────────────────────────┘
                                                │ REST / JSON
                                                ▼
                         ┌───────────────────────────────────────────────┐
                         │          Node.js / Express Server             │
                         │     (High-Throughput Orchestration Engine)     │
                         └──────┬───────────────┬────────────────┬───────┘
                                │               │                │
            ┌───────────────────┘               │                └───────────────────┐
            ▼                                   ▼                                    ▼
┌────────────────────────┐         ┌────────────────────────┐           ┌────────────────────────┐
│ Python Embedding Bridge│         │   Qdrant Cloud (RAG)   │           │   Groq LPU (LLM Engine)│
│  sentence_transformers │         │   Cosine Vector Search │           │    openai/gpt-oss-20b  │
│  (all-MiniLM-L6-v2)    │         │    384-Dim Clusters    │           │    Sub-2s Inference    │
│  384-Dim Unit Vectors  │         │    46+ Chunks Indexed  │           │   Resilient Fallback   │
└────────────────────────┘         └────────────────────────┘           └────────────────────────┘
                                                │
                                                ▼
                                   ┌────────────────────────┐
                                   │  MongoDB Atlas Store   │
                                   │  Documents, Decisions, │
                                   │  Tasks, Audit Events   │
                                   └────────────────────────┘
```

---

## 4. Vector RAG Pipeline & Live Evaluation Triad

### 4.1 Embedding Engine (`sentence_transformers`)
* **Model:** `sentence-transformers/all-MiniLM-L6-v2`
* **Dimension:** 384 dimensions (L2-normalized unit vectors)
* **Zero Vendor Lock-in:** Vector embeddings are generated locally via PyTorch / Hugging Face without recurring Gemini or OpenAI embedding API costs.

### 4.2 Real-Time RAG Evaluation Suite
Every AI response computes and surfaces real-time observability metrics:

$$\text{Faithfulness Score} = \frac{|\text{Claims Supported by Qdrant Chunks}|}{|\text{Total Claims in Generated Answer}|} \times 100$$

* **Faithfulness Gauge (%):** Groundedness score verifying that the answer doesn't hallucinate beyond the retrieved project chunks.
* **Answer Relevance (%):** Semantic alignment between the user's question and the generated answer.
* **Context Precision (%):** Signal-to-noise ratio of the retrieved vector chunks from Qdrant Cloud.
* **Semantic Coverage (%):** How comprehensively the retrieved context addresses the user prompt.
* **Latency Profiler:** Sub-millisecond breakdown across:
  * Embedding Generation: $\approx 5\text{ ms}$
  * Qdrant Vector Retrieval: $\approx 8\text{ ms}$
  * Groq LPU Token Inference: $\approx 1.5\text{--}4.0\text{ s}$
* **Throughput Indicator:** Measures generation velocity ($\approx 40\text{ tokens/sec}$).

---

## 5. Document Ingestion & Multi-Tier Storage

ContextOS implements a tiered storage architecture to prevent raw binary file bloat:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Document Ingestion & Storage Pipeline                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   1. Upload Layer              2. Database Storage           3. Vector Storage (RAG)   │
│   ┌───────────────────┐        ┌─────────────────────┐       ┌───────────────────────┐ │
│   │   User Upload     │        │  MongoDB Database   │       │     Qdrant Cloud      │ │
│   │ (.pdf, .docx, .txt)        │ (KnowledgeSource)   │       │ (Vector Knowledge DB) │ │
│   └─────────┬─────────┘        └──────────▲──────────┘       └───────────▲───────────┘ │
│             │                             │                              │             │
│             ▼                             │                              │             │
│   ┌───────────────────┐                   │                              │             │
│   │ Multer In-Memory  │                   │                              │             │
│   │   Buffer Stream   │                   │                              │             │
│   └─────────┬─────────┘                   │                              │             │
│             │                             │                              │             │
│             ▼                             │                              │             │
│   ┌───────────────────┐                   │                              │             │
│   │ FileParser Engine ├───────────────────┘                              │             │
│   │(pdf-parse/mammoth)│  Clean Text & Metadata                           │             │
│   └─────────┬─────────┘                                                  │             │
│             │                                                            │             │
│             ▼                                                            │             │
│   ┌───────────────────┐                                                  │             │
│   │ Text Chunking &   ├──────────────────────────────────────────────────┘             │
│   │  Embedding Engine │  384-Dim Vectors (all-MiniLM-L6-v2)                            │
│   └───────────────────┘                                                                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **In-Memory Streaming:** Files are received via `multer.memoryStorage()`—eliminating unnecessary local disk footprint or S3 storage costs.
2. **Native Parsing:**
   * **PDFs** parsed via `pdf-parse` (extracts text streams and page counts).
   * **DOCX** parsed via `mammoth` (extracts raw text structure).
   * **TXT/Markdown** decoded directly from buffer.
3. **Canonical Store (MongoDB):** Clean text and metadata are saved to `KnowledgeSource`.
4. **Vector Store (Qdrant Cloud):** Segmented into 500–800 character overlapping chunks, embedded into 384 dimensions, and indexed into collection `knowledge`.

---

## 6. Context Gap & Contradiction Detector

The **Context Gap Detector** identifies delivery and handover risks before they cause production outages.

### 6.1 Deterministic Rules
* **`MissingOwner`:** In-progress tasks lacking an assigned engineer.
* **`MissingDueDate`:** Critical path tasks without confirmed completion deadlines.
* **`BlockedWithoutReason`:** Tasks marked `Blocked` with empty blocker descriptions.
* **`StaleTask`:** Active tasks untouched beyond configurable threshold (default: 14 days).
* **`UnresolvedDependency`:** Tasks blocked by missing or incomplete upstream items.

### 6.2 Groq Semantic Contradiction Checking
* Cross-references stored updates to detect conflicting tech stack decisions (e.g. one note assumes Stripe while another implemented Razorpay), contradictory timelines, and undocumented blocker dependencies.

---

## 7. Context Transfer Engine (17-Part Handover)

Generates an audit-ready, exportable 17-part handover dossier:

1. Executive Summary
2. Project Background
3. Current Project State
4. Important Architectural Decisions
5. Decision Rationale & Trade-offs
6. Completed Milestones
7. Open Tasks & Backlog
8. Task Owners & Target Deadlines
9. Known Blockers
10. Critical Dependencies
11. Identified Project Risks
12. Unresolved Technical Questions
13. Recent Changes & Churn
14. Critical Documentation Links
15. Recommended Next Steps
16. Missing or Conflicting Information
17. Underlying Document References

**Export Capabilities:**
* **Print to PDF** (`window.print()` with clean print stylesheets)
* **One-Click Markdown Copy** (instant clipboard export for Slack/Notion)
* **Download `.md` File** (`contextos-handover-[date].md` file generation)

---

## 8. Technology Stack

### Frontend
* **Framework:** React 18, Vite 5, TypeScript 5.5
* **Design System:** Obsidian Dark Theme (Tailwind CSS 3.4, Linear/Vercel aesthetic)
* **Icons:** Lucide React
* **State & Caching:** TanStack React Query 5
* **Routing:** React Router DOM 6

### Backend & Orchestration
* **Runtime:** Node.js v20+ / v22+
* **Framework:** Express 4.19, TypeScript
* **Database ODM:** Mongoose 8.5
* **Validation:** Zod 3.23 (strict request/response schemas)
* **Logging & Tracing:** Pino 9.3 with correlation IDs (`x-request-id`)

### AI & Vector Infrastructure
* **Vector Database:** Qdrant Cloud (sa-east-1 AWS managed cluster)
* **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional unit vectors)
* **LLM Engine:** Groq LPU (`openai/gpt-oss-20b`)
* **Fallback Pipeline:** Groq $\rightarrow$ Gemini 1.5 Flash $\rightarrow$ Smart Domain Heuristics

---

## 9. Repository Structure

```
contextos/
├── client/                     # React 18 + Vite SPA Frontend
│   ├── src/
│   │   ├── components/         # Sidebar, Header, Card, Button, Modal, Badge
│   │   ├── context/            # ProjectContext (Global active workspace)
│   │   ├── features/           # AddKnowledgeModal, ReviewModal, TransferModal
│   │   ├── pages/              # Overview, KnowledgeHub, AskProject, GapDetector,
│   │   │                       # Tasks, ContextTransfer, Settings, ActivityLog
│   │   └── types/              # Client TypeScript models
│   └── vite.config.ts
├── server/                     # Express REST API Backend
│   ├── src/
│   │   ├── ai/                 # Groq / LLM orchestration, prompts, schemas
│   │   ├── config/             # Environment, Database, Logger
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Error handling, request ID, Zod validation
│   │   ├── models/             # Mongoose schemas (KnowledgeSource, Task, Gap, etc.)
│   │   ├── routes/             # REST endpoints (Ask, Knowledge, Qdrant, Transfer)
│   │   ├── scripts/            # embed_sentence_transformers.py (Python bridge), seed.ts
│   │   ├── services/           # QdrantService, EmbeddingService, AIService, AskService
│   │   └── utils/              # FileParser (pdf-parse, mammoth)
├── api/                        # Vercel Serverless Function entry point
│   └── index.ts
├── vercel.json                 # Vercel deployment routes and build configuration
└── README.md
```

---

## 10. Local Setup Instructions

### Prerequisites
* Node.js v18.0.0 or higher (v20+ recommended)
* Python 3.9+ with `pip`
* MongoDB Atlas or local MongoDB daemon (v6.0+)

### 1. Clone the repository
```bash
git clone https://github.com/Sonu448866/ContextOS.git
cd ContextOS
```

### 2. Install Node dependencies
```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 3. Install Python sentence-transformers
```bash
pip install torch sentence-transformers
```

### 4. Configure Environment Variables
Create `.env` in the root folder:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/contextos
CLIENT_URL=http://localhost:5173

# AI Inference (Groq LPU)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
AI_MODEL=openai/gpt-oss-20b

# Qdrant Cloud Vector Database
QDRANT_URL=https://your-cluster.sa-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION=knowledge

# Embedding Engine
EMBEDDING_PROVIDER=sentence_transformers
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
```

### 5. Seed the Demonstration Scenario
```bash
npm run seed
```

### 6. Start Development Servers
```bash
npm run dev
```
* Backend API: `http://localhost:5000`
* Frontend App: `http://localhost:5173`

---

## 11. Environment Variables Guide

| Variable | Description | Recommended Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | API server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas cluster URI | `mongodb+srv://...` |
| `AI_PROVIDER` | Primary LLM provider | `groq` |
| `AI_MODEL` | LLM model identifier | `openai/gpt-oss-20b` |
| `GROQ_API_KEY` | Secret Groq LPU API key | `gsk_...` |
| `QDRANT_URL` | Qdrant Cloud Cluster URL | `https://*.cloud.qdrant.io` |
| `QDRANT_API_KEY` | Qdrant Cloud API Key | `eyJ...` |
| `QDRANT_COLLECTION` | Qdrant vector collection name | `knowledge` |
| `EMBEDDING_PROVIDER` | Local or remote embeddings | `sentence_transformers` |
| `EMBEDDING_MODEL` | Vector model | `all-MiniLM-L6-v2` |
| `EMBEDDING_DIMENSION`| Vector dimensions | `384` |

---

## 12. REST API Endpoints Reference

### Qdrant Vector Engine
* `GET /api/qdrant/status` — Cluster health, collection status, point counts, dimension.
* `POST /api/qdrant/sync` — Synchronizes all project documents into Qdrant Cloud.

### Semantic RAG & AI
* `POST /api/projects/:projectId/ask` — Semantic Qdrant vector retrieval + Groq answer generation + live RAG Triad evaluation.
* `POST /api/knowledge/:sourceId/analyze` — Structured AI extraction of facts, decisions, and tasks.
* `POST /api/projects/:projectId/context-transfers/generate` — Synthesizes 17-part handover package.
* `POST /api/projects/:projectId/context-gaps/analyze` — Runs deterministic and LLM contradiction gap detector.

### Documents & Knowledge
* `GET /api/projects/:projectId/knowledge` — Lists project knowledge sources.
* `POST /api/projects/:projectId/knowledge` — Creates text knowledge source.
* `POST /api/projects/:projectId/knowledge/upload` — Ingests and parses `.pdf`, `.docx`, or `.txt`.
* `DELETE /api/knowledge/:sourceId` — Deletes knowledge source.

---

## 13. Step-by-Step Demonstration Script

Follow this 5-step walkthrough to demonstrate ContextOS during an interview or evaluation:

1. **Executive Dashboard (`/`):**
   * Inspect the **Project Health Score** ($78/100$) and the **Continuity Risks** summary.
   * Observe active project KPIs (tasks, knowledge chunks, identified gaps).
2. **Knowledge Hub & Vector Sync (`/knowledge`):**
   * Review pre-seeded architecture notes and updates.
   * Click **"Sync Vectors to Qdrant"** to trigger batch embedding of 46+ chunks into Qdrant Cloud.
3. **Ask Your Project & RAG Triad (`/ask`):**
   * Ask: *"Why is checkout testing blocked and what is the status of Razorpay?"*
   * Observe sub-10ms Qdrant vector retrieval.
   * Expand the **Qdrant Vector Inspector** to examine cosine similarity scores and text chunks.
   * Review the **Live RAG Triad Panel** (Faithfulness, Relevance, Precision, and latency breakdown).
4. **Context Gap Detector (`/context-gaps`):**
   * View detected critical gaps (e.g., checkout testing blocked without target completion dates).
   * Acknowledge or resolve gaps with audit logging.
5. **Context Transfer Package (`/context-transfer`):**
   * View the synthesized **17-part Handover Package**.
   * Demonstrate **Download `.md`**, **Copy Markdown**, and **Print to PDF**.

---

## 14. Interview Talking Points & Resume Bullets

### High-Impact Resume Bullets
* **ContextOS — AI-Powered Knowledge & Context Transfer Platform** `[TypeScript, React, Node.js, Qdrant Cloud, Groq LPU, SentenceTransformers]`
  * Engineered a production RAG platform to mitigate engineering knowledge loss during developer offboarding, indexing unstructured project artifacts into **Qdrant Cloud** with 384-dimensional embeddings.
  * Designed a **Live RAG Evaluation Triad** computing real-time Faithfulness, Answer Relevance, and Context Precision scores with sub-10ms vector retrieval latencies.
  * Built a **Polyglot Architecture** coupling a high-concurrency Node.js Express orchestration layer with a native Python PyTorch embedding pipeline (`all-MiniLM-L6-v2`), avoiding third-party embedding API costs.
  * Architected a **Context Gap & Contradiction Detector** combining deterministic graph checks with Groq semantic validation (`openai/gpt-oss-20b`) to eliminate unassigned dependencies before release.

### Answering: *"Why did you use TypeScript for the backend and Python for embeddings?"*
> *"I deliberately decoupled tensor math from API orchestration. Python with `sentence_transformers` handles local vector embedding generation because of PyTorch's native tensor math. For the web server and RAG pipeline, TypeScript/Node.js provides non-blocking asynchronous I/O, effortless token streaming, and end-to-end type safety between backend schemas and the React frontend without DTO drift."*

---

<div align="center">
  <b>ContextOS</b> — Everything your team knows. Nothing your team loses.
</div>
