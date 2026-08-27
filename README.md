# BuildStack

> **AI-first building materials discovery platform featuring a Guided Solution Builder, Context-Aware AI Copilot, and Deterministic Engineering Tools.**

BuildStack transforms building materials discovery from a passive catalog into an **Active AI Solution Architect**. Users describe project requirements in plain language, answer dynamic technical follow-ups, and receive certified 3-tier material assemblies backed by accurate engineering calculations and European construction standards.

- **Live Production URL:** [https://buildstack-delta.vercel.app](https://buildstack-delta.vercel.app) <- recommended way
- **API Gateway URL:** [https://buildstack-api.duckdns.org](https://buildstack-api.duckdns.org)
- **Repository:** [https://github.com/pireu2/buildstack](https://github.com/pireu2/buildstack)

---

## 1. Problem & Strategy

- **The Problem:** Traditional catalogs assume buyers already know exact product names and part numbers. Users actually know their _problem_ (e.g., "soundproof gym wall"), not the multi-layer system of companion materials needed to build it.
- **Different Product Attributes:** Construction materials have wildly different technical specs (e.g. insulation has thermal ratings, drywall has hardness & fire ratings, metal studs have steel thickness).
- **The Solution:** A natural language wizard that synthesizes complete, certified multi-product assemblies, coupled with a fast keyword and AI-powered search catalog.
- **Target Personas:** Architects & Specifiers (standards compliance), Drywall Contractors (fast material estimates), and DIY Builders (guided trade-offs).

---

## 2. System Architecture

```
                                  Client Browser
                                        │
                    ┌───────────────────┴───────────────────┐
                    │ HTTPS                                 │ HTTPS
                    ▼                                       ▼
        Vercel (Next.js 16)                     AWS EC2 (t3.micro - Free Tier)
    https://buildstack-delta.vercel.app         https://buildstack-api.duckdns.org
                                                            │
                                                  ┌─────────▼─────────┐
                                                  │   NGINX Gateway   │
                                                  │ (Let's Encrypt)   │
                                                  └────┬─────────┬────┘
                                                       │         │
                                  /api/v1/core/*       │         │  /api/v1/ai/* (Streaming)
                                  ┌────────────────────┘         └────────────────────┐
                                  ▼                                                   ▼
                       Express Core API (:5000)                             FastAPI AI Service (:8000)
                                  │                                                   │
                                  ▼                                                   ▼
                        Neon Serverless PostgreSQL                              Groq LLM API
                        (pgvector + Relational Schema)                         (openai/gpt-oss-120b)
```

| Layer               | Cloud Provider & Tech Stack                                   | Role                                                                           |
| :------------------ | :------------------------------------------------------------ | :----------------------------------------------------------------------------- |
| **Frontend**        | **Vercel** (Next.js 16, React 19, Tailwind CSS v4, shadcn/ui) | Reactive UI, streaming chat responses, filter state sync.                      |
| **Reverse Proxy**   | **AWS EC2** (NGINX Alpine + Let's Encrypt SSL)                | Path routing (`/core` vs `/ai`), CORS handling, streaming buffer management.   |
| **Core API**        | **AWS EC2** (Docker, Node.js, Express, TypeORM)               | Fast catalog search, filtering, and project saving.                            |
| **AI Microservice** | **AWS EC2** (Docker, Python 3.12, FastAPI, LangGraph)         | Multi-agent plan synthesis, AI vector search, calculation tools.               |
| **Database**        | **Neon** (Serverless PostgreSQL 16 + `pgvector`)              | Unified relational tables, flexible JSON product specs, and vector embeddings. |
| **Embeddings**      | **FastEmbed** (`nomic-ai/nomic-embed-text-v1.5`)              | In-process ONNX CPU embeddings with zero external API dependencies.            |
| **LLM Provider**    | **Groq Cloud** (`openai/gpt-oss-120b`)                        | Ultra-fast LLM inference for agent reasoning and streaming.                    |
| **Auth**            | **Neon Auth** / Social OAuth                                  | Session management, private user projects, and rate limit tiers.               |

---

## 3. Cloud Deployment & Production Infrastructure

The application is deployed across a 100% free-tier, production-ready cloud architecture:

### Frontend Deployment (Vercel)

- Hosted on **Vercel** with automated Git deployments and edge optimization.
- Environment variables connect to the live backend gateway (`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_AI_URL`) with automatic HTTPS.

### Backend Microservices (AWS EC2 + Docker Compose)

- Hosted on an **AWS EC2 `t3.micro` instance** running Ubuntu 24.04 LTS (AWS Free Tier).
- Managed via **Docker Compose** running 3 containerized services:
  1. `nginx`: Publicly exposed on ports `80` and `443` with Let's Encrypt SSL certificates mounted from `/etc/letsencrypt`.
  2. `api`: Core Node.js/Express service isolated in the internal Docker network on port `5000`.
  3. `ai-service`: Python FastAPI service isolated on port `8000` with pre-baked ONNX FastEmbed model weights.
- **Memory Resilience:** A 4GB Linux Swap file is configured on the EC2 instance to ensure smooth builds and runtime stability on the 1GB RAM machine.

### Database (Neon Serverless Postgres)

- Managed PostgreSQL with auto-scaling compute and built-in `pgvector` extension.
- Stores catalog products, flexible JSON technical metadata, regulatory standards, saved projects, and vector embeddings in the `ai` schema.

---

## 4. Implemented Features

### Materials Catalog & Standards Knowledge Base (`/catalog`)

- **Synthetic Materials Catalog & Regulatory Documents:** Realistic synthetic products across 8 European categories (Drywall, Insulation, Framing, Plasters, Fasteners, Ceilings, Flooring, Waterproofing) along with official building standard documents used for AI context.
- **Dual Search Modes:**
  - _Keyword Search:_ Fast text search for product titles, brands, and categories.
  - _AI Semantic Search:_ Natural language search using AI vector matching with similarity badges.
- **Faceted Filters & Sorting:** Dynamic category product counts, multi-select manufacturers, min/max price bounds, and multi-field sorting.
- **URL Synchronization:** Filter state synced to URL parameters (`?category=...&search=...`) for bookmarkable/shareable links.
- **UX Polish:** Active filter chips, mobile filter drawer, loading skeletons, and windowed pagination.

### Product Specification Sheets (`/catalog/[slug]`)

- **Dynamic Spec Table:** Automatically displays technical properties stored in each product's flexible JSON data.
- **Companion Materials:** Context-aware suggestions for matching studs, fasteners, and sealants.
- **Action Trigger:** Direct "Ask Copilot" button to consult the AI assistant with pre-loaded product context.

### Guided Solution Builder (`/`) & AI Workspace (`/solutions`)

- **Homepage Hero Questionnaire (`/`):** Enter project requirements directly in the homepage hero input to trigger AI-generated follow-up questions with selectable option chips.
- **3-Tier Multi-Agent Synthesis:** Parallel sub-agents synthesize _Budget_, _Balanced_, and _Premium_ options from verified catalog candidates with real-time m² cost calculations.
- **50/50 Dual-Pane Workspace (`/solutions`):** Full-height split screen with comparative assembly tier cards on the left and a streaming Solution Architect Consultation Chat on the right.

### Saved Projects & Single Plan Workspace (`/projects` & `/projects/[id]`)

- **Projects Overview:** View, manage, and delete saved building plans with dimensions, budget, and estimated cost.
- **Workspace View (`/projects/[id]`):** Left pane displays itemized materials list, standards compliance, and cost breakdowns; right pane provides persistent chat preloaded with history.

### Contextual AI Copilot

- Global sliding drawer and floating button on catalog and product pages that automatically passes active product specifications into the chat.

---

## 5. Key Architectural Choices & Rationale (The "Why")

1. **Why NoSQL / Flexible JSON Data for Products?**  
   Every building material has completely different technical properties (drywall has fire ratings and density; insulation has thermal conductivity; metal studs have steel thickness; joint sealants have setting time). A rigid database table would require dozens of empty columns for each product type. By keeping common fields (`name`, `price`, `manufacturer`, `category`) in standard database columns and storing technical details in a flexible JSON field (NoSQL style), we can easily represent hundreds of diverse products without modifying database tables.

2. **Why Split Microservices (Node.js + Python)?**  
   Node.js/Express provides high-speed, low-latency performance for catalog browsing and basic data management. Python/FastAPI natively powers the AI tools, vector searches, and multi-agent workflows, allowing both services to scale independently.

3. **Why PostgreSQL `pgvector` Over Standalone Vector Databases?**  
   Keeps all application data and AI vector embeddings inside a single database. This prevents synchronization issues and simplifies operations.

4. **Why In-Process FastEmbed ONNX for Vector Embeddings?**  
   Instead of calling remote third-party embedding APIs (which introduce network latency, rate limits, and batch size restrictions), the AI service embeds text locally on the CPU via FastEmbed ONNX (`nomic-ai/nomic-embed-text-v1.5`). Model weights are pre-baked into the Docker image, producing 768-dim embeddings in ~5ms with zero external API dependencies.

5. **Why Deterministic Engineering Tools in AI Agents?**  
   AI models can make arithmetic errors when calculating physics or building codes. We connected the AI agent to verified Python calculation tools:
   - `calculate_acoustic_performance`: Sound reduction index $R_w\text{ (dB)}$ under DIN 4109 acoustic principles.
   - `calculate_fire_resistance`: Fire resistance rating ($EI\text{ }30/60/90/120$) according to EN 13501-2.
   - `calculate_framing_bill_of_materials`: Exact stud, track, drywall board, screw, and compound quantities based on wall dimensions.

6. **Why Parallel Multi-Agent Plan Generation?**  
   Asking a single AI prompt to build 3 distinct options often produces repetitive results. Running 3 specialized sub-agents (_Budget_, _Balanced_, _Premium_) at the same time ensures distinct, well-reasoned choices with minimal wait time.

7. **Why Tiered Rate Limiting?**  
   Allows visitors to try the full experience immediately without signing up (1 plan build, 5 AI messages). Soft notifications encourage signing in to unlock saved projects and higher daily limits (10 plans, 100 messages).

---

## 6. Data Disclosure & Standards

- **Synthetic Data & Standards Modeling:** Products and regulatory knowledge documents are synthetically generated and modeled after official European building norms:
  - _Drywall:_ `EN 520` (Types A, D, F, H1, I), `DIN 18180` (densities 680–1600 kg/m³).
  - _Insulation:_ `EN 13162`, `DIN 4109` ($\lambda = 0.015\text{--}0.038\text{ W/mK}$).
  - _Metal Framing:_ `EN 14195`, `DIN 18182-1` (galvanized steel gauges).
  - _Sealants/Fillers:_ `EN 13963`, `EN 1366-3` (intumescent expansion ratios).
  - _Fasteners:_ `EN 14566`, `ETA-11/0268` (pullout resistance).
- **Assets:** High-resolution architectural imagery curated from [Unsplash Open Collection](https://unsplash.com/).
- **Limitations:** Prices and delivery lead times are realistic market benchmarks for demonstration purposes.

---

## 7. UX & Resilience

- **Loading States:** Shimmering skeletons for catalog grids, animated questionnaire loaders, and smooth streaming text for AI answers.
- **Database 503 Guard:** Returns a clean service unavailable notice with retry headers if the database drops connection, while keeping health checks active.
- **Error Handling:** Helpful empty state messages with "Reset Filters" and clear rate limit modals.
- **Responsive Design:** 50/50 desktop split workspace adapts to mobile tab switchers; collapsible filter drawers on mobile.
- **Design System:** Clean industrial aesthetic (Deep Charcoal `#18181B`, Industrial Amber `#D97706`, 8pt grid, clean iconography).

---

## 8. AI Tools Disclosure

In accordance with assignment guidelines, AI tools were used for:

- Drafting realistic technical specifications and mock catalog items matching DIN/EN norms.
- Building the vector search pipeline and formatting knowledge base documents.
- Designing the multi-agent decision graph and calculation tools.
- Assisting in frontend layouts and code review (all outputs manually reviewed, tested, and validated).

---

## 9. Local Development & Setup

### Prerequisites

- **Node.js** `>= 20.x` and **npm** `>= 10.x`
- **Python** `>= 3.12` and **uv**
- **Docker & Docker Compose**
- **PostgreSQL 16** with `pgvector` extension (e.g. free [Neon](https://neon.tech) database)
- **Groq API Key** (free at [console.groq.com](https://console.groq.com))

---

### Environment Variables Reference

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable                  | Description                                                      | Example / Recommended Value                                      |
| :------------------------ | :--------------------------------------------------------------- | :--------------------------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string with `pgvector` enabled             | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `NEON_AUTH_BASE_URL`      | Neon Auth / Better Auth server URL                               | `https://ep-xyz.neonauth.neon.tech/neondb/auth`                  |
| `NEON_AUTH_COOKIE_SECRET` | 32+ character random secret for auth session cookies             | `your-secure-32-character-secret-key-here`                       |
| `PORT`                    | Port for the Express Core API service                            | `5000`                                                           |
| `NODE_ENV`                | Environment mode (`development` or `production`)                 | `development`                                                    |
| `AI_BASE_URL`             | LLM provider base endpoint URL                                   | `https://api.groq.com/openai/v1`                                 |
| `AI_API_KEY`              | LLM provider API key                                             | `gsk_your_groq_key_here`                                         |
| `LLM_MODEL`               | Large language model identifier for reasoning                    | `openai/gpt-oss-120b` or `qwen/qwen3.8-27b`                      |
| `EMBEDDING_MODEL`         | Vector embedding model identifier (handled locally by FastEmbed) | `nomic-embed-text`                                               |
| `EMBEDDING_DIM`           | Embedding vector dimension size                                  | `768`                                                            |
| `VECTOR_SCHEMA`           | PostgreSQL schema name for vector embeddings                     | `ai`                                                             |
| `CORE_API_URL`            | Core API endpoint accessible by the Python AI service            | `http://localhost:5000/api/v1/core`                              |
| `NEXT_PUBLIC_API_URL`     | Public API Gateway endpoint for the frontend                     | `http://localhost:8080/api/v1`                                   |
| `NEXT_PUBLIC_AI_URL`      | Public AI Service endpoint for the frontend                      | `http://localhost:8080/api/v1/ai`                                |

---

### Steps

#### 1. Start all backend services (NGINX, Express API, FastAPI AI):

```bash
docker compose up --build -d
```

#### 2. Run Database Migrations & Seed Data (first time only):

```bash
# Run TypeORM migrations
docker compose run --rm api npm run migration:run

# Seed products and knowledge documents
docker compose run --rm api node dist/scripts/seed.js

# Generate and store FastEmbed vector embeddings in pgvector
docker compose run --rm ai-service python -m src.services.ingest
```

#### 3. Start Next.js Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### Verifying Service Health

| Service         | Endpoint                                   | Expected Response                                               |
| :-------------- | :----------------------------------------- | :-------------------------------------------------------------- |
| **API Gateway** | `http://localhost:8080/`                   | `{"status":"ok","message":"BuildStack API Gateway is running"}` |
| **Core API**    | `http://localhost:5000/api/v1/core/health` | `{"status":"ok","service":"core-api"}`                          |
| **AI Service**  | `http://localhost:8000/api/v1/ai/health`   | `{"status":"ok","service":"ai-service"}`                        |
| **Frontend**    | `http://localhost:3000/`                   | BuildStack Homepage & Solution Builder                          |
