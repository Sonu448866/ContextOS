# ContextOS — AI-Powered Knowledge & Context Transfer Platform

> **"Everything your team knows. Nothing your team loses."**

ContextOS is an enterprise-grade AI-powered organizational knowledge and context-transfer platform. It is engineered to prevent organizational memory loss during personnel leaves, team departures, role handovers, task reassignments, and asynchronous cross-functional dependencies.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Core Features](#3-core-features)
4. [Original Feature: Context Gap Detector](#4-original-feature-context-gap-detector)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Repository Structure](#7-repository-structure)
8. [Prerequisites](#8-prerequisites)
9. [Local Setup Instructions](#9-local-setup-instructions)
10. [Environment Variable Configuration](#10-environment-variable-configuration)
11. [MongoDB Atlas Setup](#11-mongodb-atlas-setup)
12. [AI Provider Configuration](#12-ai-provider-configuration)
13. [Supported AI Operations & Data Flow](#13-supported-ai-operations--data-flow)
14. [Knowledge Extraction Workflow & Review Safeguards](#14-knowledge-extraction-workflow--review-safeguards)
15. [Project Question-Answering (Ask Your Project)](#15-project-question-answering-ask-your-project)
16. [Context Transfer Engine](#16-context-transfer-engine)
17. [Database Collections & Data Models](#17-database-collections--data-models)
18. [REST API Endpoint Summary](#18-rest-api-endpoint-summary)
19. [Structured Logging & Observability](#19-structured-logging--observability)
20. [Log Persistence & Limitations](#20-log-persistence--limitations)
21. [Running in Development Mode](#21-running-in-development-mode)
22. [Production Build & Verification](#22-production-build--verification)
23. [Running Automated Tests](#23-running-automated-tests)
24. [Demonstration Scenario ("E-commerce Platform")](#24-demonstration-scenario-e-commerce-platform)
25. [Step-by-Step Demonstration Script](#25-step-by-step-demonstration-script)
26. [Deployment Instructions](#26-deployment-instructions)
27. [Security Considerations](#27-security-considerations)
28. [Known Limitations](#28-known-limitations)
29. [Key Assumptions](#29-key-assumptions)
30. [Interview Preparation Guide](#30-interview-preparation-guide)

---

## 1. Product Overview

ContextOS bridges the gap between static document wikis and ephemeral task tracking tools. While existing task management systems capture *what* needs to be done, they rarely preserve *why* it needs to be done, the architectural decisions that constrain it, who previously owned it, what blockers occurred, and what an incoming owner must understand to succeed.

ContextOS ingests knowledge across meeting notes, architecture decision records (ADRs), project updates, handover notes, and technical files (TXT, PDF, DOCX). It runs an AI extraction pipeline with human review safeguards, links commitments to originating sources, answers project questions with exact citations, identifies context gaps before they derail projects, and generates complete 17-part handover dossiers.

---

## 2. Problem Statement

Teams lose critical project momentum when:
- An employee goes on medical leave, parental leave, or resigns.
- Responsibility for a complex component shifts to another engineer.
- A critical task is marked "Blocked", but the reason and owner are missing.
- Architectural decisions are forgotten, leading to costly re-litigation or regressions.
- Unresolved tasks fall off meeting agendas into organizational oblivion.
- Information is fragmented across chat channels, documents, and unlinked trackers.

---

## 3. Core Features

- **Multi-Source Knowledge Hub:** Ingest pasted meeting minutes, decision records, or uploaded `.txt`, `.pdf`, and `.docx` documents.
- **AI Knowledge Extraction with Human Review:** Automatically extracts summaries, facts, decisions (with rationale), action items, blockers, risks, dependencies, and questions. Provides an interactive approval interface before saving.
- **Task & Commitment Management:** First-class database records supporting priorities, statuses (`Open`, `In Progress`, `Blocked`, `Completed`, `Cancelled`), owners, deadlines, blocker descriptions, and source references.
- **Append-Only Task History:** Complete audit trail tracking creation, status transitions, owner reassignment, due date changes, and blocker resolutions.
- **Carry-Forward Continuity:** Carry open tasks across sprints or meetings without duplicating task IDs or losing historical context.
- **Ask Your Project (AI Research Assistant):** Bounded context retrieval from stored records; cites source titles and IDs, flags uncertainties, and exposes source contradictions.
- **Context Transfer Engine:** Generates comprehensive 17-part handover packages with structured cards, markdown view, and browser print-to-PDF export.
- **Activity Log & Observability:** Database-persisted event collection with correlation IDs (`x-request-id`) and structured Pino logging.

---

## 4. Original Feature: Context Gap Detector

The **Context Gap Detector** identifies continuity risks before they cause delivery delays. It combines deterministic validation rules for structured data with AI-assisted contradiction analysis for unstructured sources.

### 4.1 Deterministic Rules
- **Missing Owner (`MissingOwner`):** Active tasks (`Open` / `In Progress`) with null or empty owners (Severity: High).
- **Missing Due Date (`MissingDueDate`):** Active tasks missing target completion dates, especially critical tasks blocking downstream work (Severity: Critical/Medium).
- **Blocked Without Explanation (`BlockedWithoutReason`):** Tasks marked `Blocked` with empty blocker descriptions (Severity: High).
- **Stale Tasks (`StaleTask`):** Active tasks untouched beyond configurable threshold (default: 14 days) (Severity: Medium).
- **Unresolved Dependencies (`UnresolvedDependency`):** In-progress or blocked tasks referencing missing or incomplete upstream tasks (Severity: High).
- **Decisions Lacking Rationale (`MissingRationale`):** Recorded decisions missing the trade-off context or reasons (Severity: Medium).
- **Handover Omissions (`OmittedOpenTask`):** Active project tasks missing from a generated handover package (Severity: Medium).

### 4.2 AI-Assisted Contradiction Analysis
- Cross-references stored updates to detect conflicting deadlines, owner disputes, contradictory project statuses (e.g. one note claims "on track" while another states "blocked"), and unrecorded blockers.

### 4.3 Lifecycle & Resolution
Every gap has a defined status: `Open` ➔ `Acknowledged` ➔ `Resolved` or `Dismissed` (false positive). Resolving a gap logs an audit event and updates the overall Project Health Score.

---

## 5. Technology Stack

### Frontend
- **Framework:** React 18, Vite 5, TypeScript 5.5
- **Styling:** Tailwind CSS 3.4 (clean neutral design system, custom typography, print styles)
- **Icons:** Lucide React
- **Routing:** React Router DOM 6
- **Server State & Caching:** TanStack React Query 5
- **Forms & Validation:** React Hook Form with Zod schemas
- **Dates:** date-fns

### Backend
- **Runtime:** Node.js v20+ / v22+
- **Server Framework:** Express 4.19, TypeScript
- **Database ORM:** Mongoose 8.5
- **Validation:** Zod 3.23 (strict request validation for body, query, and params)
- **Logging:** Pino 9.3 with `pino-pretty` and rotating file transport (`pino-roll` compatible)
- **Security:** Helmet, CORS, body limits, upload restrictions
- **File Ingestion:** Multer (memory buffer), `pdf-parse` (PDF text streams), `mammoth` (DOCX extraction)
- **Correlation IDs:** UUIDv4 via `x-request-id` header

### Database
- **MongoDB Atlas** or Local MongoDB 6.0+

### Testing & Quality
- **Test Runner:** Vitest 2.0
- **API Testing:** Supertest 7.0

---

## 6. System Architecture

```
                    ┌──────────────────────────────────────────┐
                    │               Web Client                 │
                    │  (React 18 + Vite + Tailwind + Query)    │
                    └────────────────────┬─────────────────────┘
                                         │ REST API / JSON
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              ContextOS Server                                │
│                                                                              │
│  ┌─────────────────────────┐  ┌───────────────────────────────────────────┐  │
│  │   Request Middleware    │  │               API Controllers             │  │
│  │ - Request ID (UUID)     │  │ - Projects, Knowledge, Tasks, Ask         │  │
│  │ - Pino Structured Log   │─▶│ - Context Transfers, Context Gaps         │  │
│  │ - Zod Request Validate  │  │ - Activity Log, Dashboard, Health, Seed   │  │
│  │ - Central Error Handler │  └─────────────────────┬─────────────────────┘  │
│  └─────────────────────────┘                        │                        │
│                                                     ▼                        │
│                               ┌───────────────────────────────────────────┐  │
│                               │              Service Layer                │  │
│                               │ - ProjectService, KnowledgeService        │  │
│                               │ - TaskService, ContextGapService          │  │
│                               │ - ContextTransferService, AskService      │  │
│                               │ - ActivityService, SeedService            │  │
│                               └──────┬──────────────────────┬─────────────┘  │
│                                      │                      │                │
│                 ┌────────────────────┘                      └──────┐         │
│                 ▼                                                  ▼         │
│  ┌─────────────────────────────┐                    ┌─────────────────────┐  │
│  │       AI Service Layer      │                    │  Data Models (ODM)  │  │
│  │ - Provider Abstraction      │                    │ - Project           │  │
│  │ - Gemini / OpenAI / Anthropic│                    │ - KnowledgeSource   │  │
│  │ - Structured Zod Validation │                    │ - KnowledgeRecord   │  │
│  │ - Safe Mock Fallback Engine │                    │ - Task & History    │  │
│  └──────────────┬──────────────┘                    │ - ContextTransfer   │  │
│                 │                                   │ - ContextGap        │  │
│                 │                                   │ - ActivityEvent     │  │
│                 ▼                                   └──────────┬──────────┘  │
└─────────────────┼──────────────────────────────────────────────┼─────────────┘
                  │                                              │
                  ▼                                              ▼
    ┌───────────────────────────┐                 ┌───────────────────────────┐
    │     External LLM APIs     │                 │   Persistent MongoDB      │
    │ (Gemini / OpenAI / Claude)│                 │   (Atlas or Local 6.0+)   │
    └───────────────────────────┘                 └───────────────────────────┘
```

---

## 7. Repository Structure

```
contextos/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI & Layout Components
│   │   │   ├── layout/         # Sidebar, Header, MainLayout
│   │   │   └── ui/             # Badge, Button, Card, Modal, EmptyState, Spinner
│   │   ├── context/            # ProjectContext (Global Active Project State)
│   │   ├── features/           # Feature Modals & Drawers
│   │   │   ├── AddKnowledgeModal.tsx
│   │   │   ├── KnowledgeReviewModal.tsx
│   │   │   ├── CreateProjectModal.tsx
│   │   │   ├── CreateTaskModal.tsx
│   │   │   ├── TaskDetailDrawer.tsx
│   │   │   ├── CarryForwardModal.tsx
│   │   │   ├── ContextTransferModal.tsx
│   │   │   └── ContextGapResolveModal.tsx
│   │   ├── lib/                # API client, utils, queryClient
│   │   ├── pages/              # 10 Required SaaS Pages
│   │   │   ├── OverviewPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ProjectWorkspacePage.tsx
│   │   │   ├── KnowledgeHubPage.tsx
│   │   │   ├── TasksPage.tsx
│   │   │   ├── AskProjectPage.tsx
│   │   │   ├── ContextTransferPage.tsx
│   │   │   ├── ContextGapDetectorPage.tsx
│   │   │   ├── ActivityLogPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── types/              # Client TypeScript models
│   │   ├── App.tsx             # Route Configuration
│   │   └── main.tsx            # App Bootstrap
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                     # Backend REST API
│   ├── src/
│   │   ├── ai/                 # AI Service Abstraction, Prompts, Schemas
│   │   ├── config/             # Environment, Database, Logger
│   │   ├── controllers/        # Request Handlers
│   │   ├── middleware/         # Request ID, Logging, Errors, Zod Validation
│   │   ├── models/             # Mongoose Schemas (8 Collections)
│   │   ├── routes/             # REST Route Definitions
│   │   ├── scripts/            # Seed script
│   │   ├── services/           # Business Logic
│   │   ├── tests/              # Automated Test Suite (Vitest + Supertest)
│   │   ├── utils/              # File Parser (TXT, PDF, DOCX)
│   │   ├── app.ts              # Express App Setup
│   │   └── index.ts            # Server Entry Point
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── shared/
│   └── types/                  # Shared TypeScript interfaces & DTOs
├── logs/                       # Persistent Structured Logs
├── uploads/                    # File Upload Storage
├── .env.example                # Documented configuration template
├── .gitignore
├── package.json                # Root orchestration scripts
└── README.md
```

---

## 8. Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ / v22+ recommended)
- **npm:** v9.0.0 or higher
- **MongoDB:** MongoDB Atlas cluster URI or local MongoDB daemon (6.0+)

---

## 9. Local Setup Instructions

### Step 1: Clone or navigate to the repository
```bash
cd DigiPlusIT
```

### Step 2: Install dependencies
```bash
# Install root, server, and client dependencies
npm install
npm install --prefix server
npm install --prefix client
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` in the root directory (or `server/.env`):
```bash
cp .env.example .env
```
Edit `.env` with your settings (e.g. your MongoDB URI and AI API key).

### Step 4: Seed the Demonstration Project
```bash
npm run seed
```

### Step 5: Start Development Servers
```bash
# Runs backend on http://localhost:5000 and frontend on http://localhost:5173
npm run dev
```

---

## 10. Environment Variable Configuration

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `development` | Environment mode (`development`, `production`, `test`) |
| `PORT` | Number | `5000` | Port for Express API backend |
| `MONGODB_URI` | String | `mongodb://localhost:27017/contextos` | MongoDB Atlas or local connection string |
| `CLIENT_URL` | String | `http://localhost:5173` | Allowed frontend origin for CORS |
| `VITE_API_URL` | String | `http://localhost:5000/api` | API URL consumed by client |
| `AI_PROVIDER` | String | `gemini` | Configured LLM provider (`gemini`, `openai`, `anthropic`, `mock`) |
| `AI_API_KEY` | String | `""` | Secret API key for AI provider (never exposed to frontend) |
| `AI_MODEL` | String | `gemini-1.5-flash` | LLM model identifier |
| `LOG_LEVEL` | String | `info` | Pino log level (`fatal`, `error`, `warn`, `info`, `debug`) |
| `LOG_FILE_PATH`| String | `logs/app.log` | Persistent file destination for structured logs |
| `MAX_UPLOAD_SIZE_MB` | Number | `10` | Maximum file upload size limit in megabytes |
| `RATE_LIMIT_WINDOW_MS` | Number | `60000` | Rate limiting window duration (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | Number | `100` | Allowed requests per window |
| `STALE_TASK_DAYS` | Number | `14` | Days without update before a task is flagged as stale |

---

## 11. MongoDB Atlas Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user with read/write credentials.
3. In **Network Access**, add `0.0.0.0/0` (or your deployment IP).
4. Copy the connection string into your `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/contextos?retryWrites=true&w=majority
   ```
5. If MongoDB is unreachable on startup, the server boots in degraded mode, logs a clear warning, and displays a connectivity alert on the `/settings` page without crashing.

---

## 12. AI Provider Configuration

ContextOS features a **provider-independent AI service layer** (`server/src/ai/ai.service.ts`).

### Supported Providers:
- **Google Gemini (`gemini`):** Set `AI_PROVIDER=gemini`, `AI_API_KEY=<your-gemini-key>`, `AI_MODEL=gemini-1.5-flash`
- **OpenAI (`openai`):** Set `AI_PROVIDER=openai`, `AI_API_KEY=<your-openai-key>`, `AI_MODEL=gpt-4o-mini`
- **Anthropic (`anthropic`):** Set `AI_PROVIDER=anthropic`, `AI_API_KEY=<your-anthropic-key>`, `AI_MODEL=claude-3-5-sonnet-20240620`
- **Mock Fallback (`mock`):** Set `AI_PROVIDER=mock` or leave `AI_API_KEY` empty. In mock mode, the system executes deterministic heuristics generating structured JSON conforming to the exact Zod schemas for automated tests and offline evaluation.

### Graceful Degradation:
If an API key is missing or the external AI provider is unavailable:
- Non-AI operations (creating projects, adding knowledge, managing tasks, task history, deterministic gap checks, audit logs) remain 100% operational.
- The UI displays an informative error message explaining that the AI provider is unavailable. The system never fakes a successful AI response when a call fails.

---

## 13. Supported AI Operations & Data Flow

1. **Structured Knowledge Extraction:** Document text + Project context ➔ LLM ➔ Cleaned JSON ➔ Zod Validation (`AIExtractionSchema`) ➔ Review UI ➔ Committed Records.
2. **Project Question Answering:** User question ➔ Bounded MongoDB context retrieval (relevant sources, tasks, decisions) ➔ LLM with strict citation prompt ➔ Validated JSON (`AIAnswerSchema`) ➔ Interactive answer card with source excerpts.
3. **Context Transfer Generation:** Project metadata + all tasks + decisions + blockers + gaps ➔ LLM ➔ 17-part handover package (`AIContextTransferSchema`) ➔ Markdown synthesis ➔ MongoDB persistence.
4. **AI-Assisted Gap Detection:** Knowledge sources + task records ➔ LLM contradiction prompt ➔ Validated findings (`AIGapAnalysisSchema`) ➔ ContextGap records.

---

## 14. Knowledge Extraction Workflow & Review Safeguards

To prevent AI hallucinations from polluting project records without human oversight:
1. User enters text or uploads a document in the Knowledge Hub.
2. Raw text is saved to `KnowledgeSource` in MongoDB.
3. User clicks **"Run AI Extraction"**.
4. The backend calls the LLM, parses the JSON, and validates the response with Zod.
5. An interactive **Knowledge Review Modal** opens:
   - User reviews decisions and rationale.
   - User reviews proposed action items, adjusts owners, statuses, or deadlines.
   - User can delete unsuitable suggestions.
6. When the user clicks **"Confirm & Commit"**, decisions are saved as `KnowledgeRecord`s and tasks are created in the `Task` collection with persistent source references back to the document.

---

## 15. Project Question-Answering (Ask Your Project)

Users can ask complex questions about their project:
- ContextOS queries MongoDB for up to 10 relevant knowledge sources, recent tasks, and active decisions.
- Bounded context is sent to the LLM.
- Output includes:
  - Concise, factual answer.
  - Supporting source citations with source IDs and excerpts.
  - Explicit uncertainty notes if information is missing.
  - Conflict warnings if different sources state contradictory facts.

---

## 16. Context Transfer Engine

The engine generates an export-ready 17-part handover containing:
1. Executive Summary
2. Project Background
3. Current Project State
4. Important Decisions
5. Decision Rationale
6. Completed Work
7. Open Tasks
8. Task Owners and Due Dates
9. Blockers
10. Dependencies
11. Known Risks
12. Unresolved Questions
13. Recent Changes
14. Critical Documentation
15. Recommended Next Steps
16. Missing or Conflicting Information
17. Underlying Document References

Users can toggle between structured view and clean Markdown, and use **Print to PDF** (`window.print()`) for an audit-ready physical or digital PDF report.

---

## 17. Database Collections & Data Models

- **`projects`:** `_id`, `name`, `description`, `status`, `members`, `startDate`, `targetDate`, timestamps.
- **`knowledgesources`:** `_id`, `projectId`, `title`, `sourceType`, `originalText`, `fileMetadata`, `tags`, `author`, `processingStatus`, `extractionStatus`, `extractionError`, timestamps.
- **`knowledgerecords`:** `_id`, `projectId`, `sourceId`, `recordType` (`Fact`, `Decision`, `Risk`, `Blocker`), `title`, `content`, `structuredData`, `evidence`, `confidence`, `reviewStatus`, timestamps.
- **`tasks`:** `_id`, `projectId`, `title`, `description`, `owner`, `dueDate`, `priority`, `status`, `dependencies`, `blockerDescription`, `sourceReferences`, `relatedDecisionIds`, `carriedForwardCount`, `completedAt`, timestamps.
- **`taskhistories`:** `_id`, `taskId`, `projectId`, `eventType`, `previousValue`, `newValue`, `actor`, `sourceId`, `requestId`, `createdAt`.
- **`contexttransfers`:** `_id`, `projectId`, `transferType`, `outgoingOwner`, `incomingOwner`, `period`, `instructions`, `generatedContent` (17 sections + rawMarkdown), `sourceReferences`, `generationStatus`, timestamps.
- **`contextgaps`:** `_id`, `projectId`, `gapType`, `severity`, `description`, `affectedRecordType`, `affectedRecordId`, `evidence`, `recommendedResolution`, `detectionMethod`, `status`, `detectedAt`, `resolvedAt`, timestamps.
- **`activityevents`:** `_id`, `projectId`, `eventType`, `entityType`, `entityId`, `message`, `metadata`, `requestId`, `outcome`, `actor`, `createdAt`.

---

## 18. REST API Endpoint Summary

### Health
- `GET /api/health` — Returns service status, MongoDB connectivity, and AI provider info.

### Projects
- `GET /api/projects` — List projects with task, source, and gap metrics.
- `POST /api/projects` — Create project.
- `GET /api/projects/:projectId` — Get project details.
- `PATCH /api/projects/:projectId` — Update project.

### Knowledge
- `GET /api/projects/:projectId/knowledge` — List sources for project.
- `POST /api/projects/:projectId/knowledge` — Create text knowledge source.
- `POST /api/projects/:projectId/knowledge/upload` — Upload TXT, PDF, or DOCX document.
- `GET /api/knowledge/:sourceId` — Get source details.
- `DELETE /api/knowledge/:sourceId` — Delete source.
- `POST /api/knowledge/:sourceId/analyze` — Trigger AI knowledge extraction.
- `POST /api/knowledge/:sourceId/commit` — Commit reviewed decisions and action items.

### Tasks
- `GET /api/projects/:projectId/tasks` — List tasks with status/priority filters.
- `POST /api/projects/:projectId/tasks` — Create task.
- `GET /api/tasks/:taskId` — Get task details.
- `PATCH /api/tasks/:taskId` — Update task status, owner, due date, or blocker.
- `GET /api/tasks/:taskId/history` — Get append-only task history.
- `POST /api/tasks/:taskId/carry-forward` — Carry forward task to next cycle.

### Ask Project
- `POST /api/projects/:projectId/ask` — Query project research assistant with citations.

### Context Transfer
- `POST /api/projects/:projectId/context-transfers/generate` — Generate handover package.
- `GET /api/projects/:projectId/context-transfers` — List generated transfers.
- `GET /api/context-transfers/:transferId` — Get transfer package.

### Context Gaps
- `POST /api/projects/:projectId/context-gaps/analyze` — Run gap detector.
- `GET /api/projects/:projectId/context-gaps` — List gaps with filters.
- `PATCH /api/context-gaps/:gapId` — Update gap status (`Acknowledged`, `Resolved`, `Dismissed`).

### Activity & Observability
- `GET /api/activity` — Get paginated activity stream.
- `POST /api/seed` — Seed assessment demonstration scenario.

---

## 19. Structured Logging & Observability

- **Engine:** Pino with `pino-pretty` console formatting.
- **Request Tracing:** Every incoming request receives or inherits an `x-request-id` correlation identifier.
- **Sanitization:** Automatically redacts `authorization`, `x-api-key`, `password`, `apiKey`, and secret tokens.
- **Event Logging:** Logs duration in milliseconds, HTTP method, route, status code, and sanitized error messages.
- **AI Operation Logging:** Logs model name, provider, duration, and outcome without logging raw prompt secrets.

---

## 20. Log Persistence & Limitations

- Logs stream to standard output (`stdout`) and append to `logs/app.log` when persistent storage is available.
- **Ephemeral Filesystem Limitation:** On containerized hosts with ephemeral disks (e.g. Heroku, standard Render instances), file logs do not survive redeployments. In those environments, standard output streaming or external log aggregators (e.g. Datadog, Papertrail) should be used. Database activity events in the `ActivityEvent` collection remain permanent.

---

## 21. Running in Development Mode

```bash
# Run both server (port 5000) and client (port 5173) concurrently:
npm run dev

# Or run separately:
npm run dev:server
npm run dev:client
```

---

## 22. Production Build & Verification

```bash
# Build both server and client:
npm run build

# Start production server:
npm run start
```
Verification confirms:
- Server TypeScript transpiles to `server/dist/`.
- Client Vite bundle builds to `client/dist/` with minified CSS and JavaScript chunks.

---

## 23. Running Automated Tests

```bash
npm run test
```
The test suite covers:
1. Project creation validation (Zod).
2. Knowledge source creation validation.
3. Task creation with optional owners and deadlines.
4. Task carry-forward parameter validation.
5. Context gap deterministic detection rules:
   - Missing owners on active tasks.
   - Blocked tasks without blocker descriptions.
   - Missing due dates on critical tasks.
6. AI response schema validation (Extraction, Answer, Context Transfer, Gap Analysis).
7. AI extraction mock fallback and rationale preservation.
8. AI project question-answering with citations and uncertainty handling.
9. AI 17-part context transfer generation.
10. Supertest REST API integration tests:
    - `/api/health` connectivity and correlation ID generation.
    - Bad request 400 validation error formatting.
    - 404 route handling.

---

## 24. Demonstration Scenario ("E-commerce Platform")

The seed dataset models the technical assessment scenario:

- **Source 1: Payment Architecture Decision**
  - Content: *"The team has decided to use Razorpay for the payment integration. Checkout testing should begin after the payment integration is implemented and webhook verification has been validated. The purpose of webhook verification is to ensure that payment status updates are handled reliably."*
- **Source 2: Payment Integration Update**
  - Content: *"The payment integration is still incomplete. Webhook verification is failing and requires further investigation. Rahul is responsible for resolving the integration issue. No confirmed completion date has been recorded."*
- **Source 3: Checkout Testing Update**
  - Content: *"Priya is responsible for checkout testing. Testing is blocked until the payment integration and webhook verification are resolved. Priya will prepare the checkout testing report after the tests are completed."*
- **Source 4: General Project Handover**
  - Content: *"The next person taking over the payment work needs to review the Razorpay integration, investigate the webhook verification failure, confirm the integration's readiness, and coordinate with Priya before checkout testing starts. The team should confirm the completion date because no confirmed deadline is currently recorded."*

### Pre-Seeded Tasks:
1. **Resolve payment integration and webhook verification:** Owner: Rahul, Due date: `null` (Missing!), Priority: Critical, Status: In Progress, Blocker: "Webhook verification is failing and requires further investigation."
2. **Complete checkout testing:** Owner: Priya, Due date: `null`, Priority: High, Status: Blocked, Blocker: "Testing is blocked until the payment integration and webhook verification are resolved.", Dependency: "Resolve payment integration and webhook verification".
3. **Prepare checkout testing report:** Owner: Priya, Due date: `null`, Priority: Medium, Status: Open.

### Pre-Seeded Decisions:
1. **Use Razorpay for payment integration:** Rationale: "Ensures payment status updates are handled reliably once webhook verification is validated."

---

## 25. Step-by-Step Demonstration Script

Follow this 10-step sequence to verify all capabilities:

1. **Open Dashboard (`/`):**
   - Observe the "E-commerce Platform" project metrics.
   - Notice the Project Health banner indicating risks, counts of blocked tasks, and detected critical gaps.
2. **Open Knowledge Hub (`/knowledge`):**
   - Inspect the 4 pre-seeded documents.
   - Click on any document to see the exact text.
3. **Add New Knowledge (`/knowledge`):**
   - Click **"Add Knowledge Source"**.
   - Paste a note or upload a `.txt`/`.pdf`/`.docx` file and save it to MongoDB.
4. **Run AI Extraction:**
   - Click **"Run AI Extraction"** on any document.
   - Inspect the **Knowledge Review Modal** displaying extracted summary, decisions (with rationale), action items, and risks.
   - Click **"Confirm & Commit"** to persist new tasks and decisions.
5. **Ask Your Project (`/ask`):**
   - Select or click the prompt: *"Why is checkout testing delayed?"*
   - Observe the synthesized answer explaining the dependency on Rahul's webhook resolution, accompanied by citations from Source 2 and Source 3.
6. **Task Management & History (`/tasks`):**
   - View the tasks for Rahul and Priya.
   - Click on "Complete checkout testing" to open the slide-over drawer.
   - Inspect the append-only audit timeline showing creation, status changes, and blocker additions.
7. **Generate Context Transfer (`/context-transfer`):**
   - Click **"Generate New Handover"** with Outgoing Owner: "Rahul Sharma", Incoming Owner: "New Payment Lead".
   - View the comprehensive 17-part handover package.
   - Switch between Structured View and Markdown, then click **"Print to PDF"**.
8. **Context Gap Detector (`/context-gaps`):**
   - Click **"Run Gap Analysis"**.
   - Notice the detected critical gap: *"Checkout testing is blocked, but the payment integration task has no confirmed deadline."*
   - Click the gap to open the resolve modal, then mark it **"Acknowledged"** or **"Resolved"**.
9. **Carry Forward Work (`/tasks`):**
   - Open a task drawer, click **"Carry Forward Task"**, enter a cycle label (e.g. "Sprint 24"), and confirm.
   - Notice the badge updates to `Carried Forward x1` while preserving the exact same task ID and appending an audit record.
10. **Inspect Activity Log (`/activity`):**
    - View real-time audit entries for project updates, task status changes, context transfer generation, and gap resolutions with correlation IDs.

---

## 26. Deployment Instructions

### 🌟 Option A: Complete Fullstack Deployment on Vercel (Recommended)

ContextOS is pre-configured with `vercel.json` and a serverless entry point at `api/index.js`. You can deploy the complete application (Vite SPA frontend + Express API serverless backend) directly to Vercel in one single project:

#### Method 1: Deploy via Vercel Web Dashboard (GitHub)
1. Push your repository to **GitHub** (or GitLab/Bitbucket).
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Add New... > Project"**.
3. Import your `ContextOS` repository.
4. Configure the project settings:
   - **Framework Preset:** Vite (or Other)
   - **Root Directory:** `./` (Leave as root)
   - **Build Command:** `npm run build` (or leave default, configured in `vercel.json`)
   - **Output Directory:** `client/dist`
5. In **Environment Variables**, add:
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `AI_PROVIDER` | `gemini` | Configured AI provider |
   | `AI_API_KEY` | `AQ.Ab8RN6...` | Your Google Gemini API Key |
   | `AI_MODEL` | `gemini-3.8-flash` | Selected Gemini model |
   | `NODE_ENV` | `production` | Production mode |
6. Click **"Deploy"**.
7. Vercel will build the React SPA to `client/dist` and mount `/api/*` to the serverless Express function. Once deployed, visit your `https://your-project.vercel.app` URL!

#### Method 2: Deploy via Vercel CLI
From your terminal in the project root:
```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Deploy to preview
vercel

# 3. Add environment variables
vercel env add MONGODB_URI
vercel env add AI_PROVIDER
vercel env add AI_API_KEY
vercel env add AI_MODEL

# 4. Deploy to production
vercel --prod
```

---

### Option B: Unified Node.js Container Deployment (Render / Railway / Fly.io / Heroku)
1. In `package.json`, the build and start scripts build both client and server:
   ```bash
   npm run build
   npm run start
   ```
2. In production mode, Express serves the static frontend assets from `client/dist` and handles API requests under `/api`.
3. Set environment variables on your platform:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=<your-mongodb-atlas-uri>`
   - `AI_PROVIDER=gemini`
   - `AI_API_KEY=<your-key>`
   - `AI_MODEL=gemini-1.5-flash`

### Option B: Separate Frontend & Backend Services
- **Backend (e.g. Render Web Service):**
  - Build command: `npm install --prefix server && npm run build --prefix server`
  - Start command: `npm run start --prefix server`
  - Environment: `MONGODB_URI`, `CLIENT_URL=https://your-frontend.vercel.app`, `AI_API_KEY`
- **Frontend (e.g. Vercel / Netlify):**
  - Root directory: `client`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment: `VITE_API_URL=https://your-backend.onrender.com/api`

---

## 27. Security Considerations

- **Secret Isolation:** API keys and database credentials exist only in environment variables and are never committed or exposed to the client.
- **HTTP Security Headers:** Protected with Helmet against clickjacking, MIME-sniffing, and cross-site injection.
- **CORS Allowlist:** Restricted to configured frontend origins.
- **Pino Log Redaction:** Secret paths (`apiKey`, `password`, `authorization`, `token`) are automatically scrubbed from structured log outputs.
- **Untrusted Input Protection:** Prompt templates instruct the LLM to treat document contents strictly as untrusted data, ignoring embedded prompt-injection commands.
- **File Validation:** Restricts uploads to `.txt`, `.pdf`, `.docx` with a strict 10MB size limit.

---

## 28. Known Limitations

1. **Scanned PDF OCR:** The current release extracts digital text streams from PDF and DOCX documents using native text parsers. Scanned image-only PDFs without text layers require an OCR engine (such as Tesseract), which is not bundled in this version and is explicitly documented in the upload UI.
2. **Ephemeral File Storage:** On serverless or container platforms without attached disks, files written to `uploads/` or `logs/app.log` do not persist across instance restarts. Production deployments should attach a persistent volume or use cloud object storage (e.g. S3).
3. **Vector Embeddings:** The question-answering assistant uses bounded MongoDB context queries and keyword matching rather than vector embeddings to ensure fast, deterministic operation without requiring external vector database infrastructure.

---

## 29. Key Assumptions

- Users authenticate through their organization's SSO or deployment environment; an open demonstration mode is provided for the assessment without mock authentication gates.
- Projects contain up to dozens of sources and hundreds of tasks; bounded retrieval windows ensure context remains well within token constraints.

---

## 30. Interview Preparation Guide

When explaining this implementation in a technical assessment interview, highlight:
- **Architecture Separation:** Clean separation of concerns across controllers, validation middleware, business services, database models, and an AI provider abstraction.
- **The Original Feature:** Explain how the Context Gap Detector combines deterministic rules (e.g., regex/schema validation for unassigned tasks and missing dates) with LLM semantic contradiction checks.
- **Data Integrity:** Emphasize that tasks are first-class MongoDB documents with append-only history, and decisions require human review before saving.
- **Resilience:** Highlight graceful degradation when AI keys are unconfigured or when MongoDB Atlas experiences latency.

---

*ContextOS — Everything your team knows. Nothing your team loses.*
