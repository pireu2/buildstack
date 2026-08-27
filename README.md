# BuildStack

> **AI-first building materials discovery platform featuring a Guided Solution Builder, Context-Aware AI Copilot, and Deterministic Engineering Tools.**

BuildStack transforms building materials discovery from a passive catalog into an **Active AI Solution Architect**. Users describe project requirements in plain language, answer dynamic technical follow-ups, and receive certified 3-tier material assemblies backed by accurate engineering calculations and European construction standards.

- **Live Demo:** [https://buildstack.pireu.ro](https://buildstack.pireu.ro)
- **Repository:** [https://github.com/pireu2/buildstack](https://github.com/pireu2/buildstack)

---

## 1. Problem & Strategy

- **The Problem:** Traditional catalogs assume buyers already know exact product names and part numbers. Users actually know their *problem* (e.g., "soundproof gym wall"), not the multi-layer system of companion materials needed to build it.
- **Different Product Attributes:** Construction materials have wildly different technical specs (e.g. insulation has thermal ratings, drywall has hardness & fire ratings, metal studs have steel thickness).
- **The Solution:** A natural language wizard that synthesizes complete, certified multi-product assemblies, coupled with a fast keyword and AI-powered search catalog.
- **Target Personas:** Architects & Specifiers (standards compliance), Drywall Contractors (fast material estimates), and DIY Builders (guided trade-offs).

---

## 2. System Architecture

```
Client (Next.js 16 / React 19)
       │ HTTPS / REST / Streaming
       ▼
NGINX Gateway (:8080)
       ├── /api/v1/core/* ──► Express API (:5000) ──► PostgreSQL (Relational Data)
       └── /api/v1/ai/*   ──► FastAPI Service (:8000) ─► PostgreSQL + pgvector (Embeddings)
```

| Layer | Tech Stack | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui | Reactive UI, streaming chat responses, filter state sync. |
| **Gateway** | NGINX Alpine | Path routing (`/core` vs `/ai`), CORS handling, streaming buffer management. |
| **Core API** | Node.js, Express, TypeORM, TypeScript | Fast catalog search, filtering, and project saving. |
| **AI Service** | Python 3.12, FastAPI, LangGraph, SQLAlchemy 2.0 | Multi-agent plan synthesis, AI vector search, calculation tools. |
| **Database** | PostgreSQL 16 + `pgvector` | Unified relational tables, flexible JSON product specs, and vector embeddings. |
| **Auth** | Neon Auth / Social OAuth | Session management, private user projects, and rate limit tiers. |

---

## 3. Implemented Features

### Materials Catalog & Standards Knowledge Base (`/catalog`)
- **Synthetic Materials Catalog & Regulatory Documents:** Realistic synthetic products across 8 European categories (Drywall, Insulation, Framing, Plasters, Fasteners, Ceilings, Flooring, Waterproofing) along with official building standard documents used for AI context.
- **Dual Search Modes:**
  - *Keyword Search:* Fast text search for product titles, brands, and categories.
  - *AI Semantic Search:* Natural language search using AI vector matching with similarity badges.
- **Faceted Filters & Sorting:** Dynamic category product counts, multi-select manufacturers, min/max price bounds, and multi-field sorting.
- **URL Synchronization:** Filter state synced to URL parameters (`?category=...&search=...`) for bookmarkable/shareable links.
- **UX Polish:** Active filter chips, mobile filter drawer, loading skeletons, and windowed pagination.

### Product Specification Sheets (`/catalog/[slug]`)
- **Dynamic Spec Table:** Automatically displays technical properties stored in each product's flexible JSON data.
- **Companion Materials:** Context-aware suggestions for matching studs, fasteners, and sealants.
- **Action Trigger:** Direct "Ask Copilot" button to consult the AI assistant with pre-loaded product context.

### Guided Solution Builder (`/`) & AI Workspace (`/solutions`)
- **Homepage Hero Questionnaire (`/`):** Enter project requirements directly in the homepage hero input to trigger AI-generated follow-up questions with selectable option chips.
- **3-Tier Multi-Agent Synthesis:** Parallel sub-agents synthesize *Budget*, *Balanced*, and *Premium* options from verified catalog candidates with real-time m² cost calculations.
- **50/50 Dual-Pane Workspace (`/solutions`):** Full-height split screen with comparative assembly tier cards on the left and a streaming Solution Architect Consultation Chat on the right.

### Saved Projects & Single Plan Workspace (`/projects` & `/projects/[id]`)
- **Projects Overview:** View, manage, and delete saved building plans with dimensions, budget, and estimated cost.
- **Workspace View (`/projects/[id]`):** Left pane displays itemized materials list, standards compliance, and cost breakdowns; right pane provides persistent chat preloaded with history.

### Contextual AI Copilot
- Global sliding drawer and floating button on catalog and product pages that automatically passes active product specifications into the chat.

---

## 4. Key Architectural Choices & Rationale (The "Why")

1. **Why NoSQL / Flexible JSON Data for Products?**  
   Every building material has completely different technical properties (drywall has fire ratings and density; insulation has thermal conductivity; metal studs have gauge thickness; joint sealants have setting time). A rigid database table would require dozens of empty columns for each product type. By keeping common fields (`name`, `price`, `manufacturer`, `category`) in standard database columns and storing technical details in a flexible JSON field (NoSQL style), we can easily represent hundreds of diverse products without modifying database tables.

2. **Why Split Microservices (Node.js + Python)?**  
   Node.js/Express provides high-speed, low-latency performance for catalog browsing and basic data management. Python/FastAPI natively powers the AI tools, vector searches, and multi-agent workflows, allowing both services to scale independently.

3. **Why PostgreSQL `pgvector` Over Standalone Vector Databases?**  
   Keeps all application data and AI vector embeddings inside a single database. This prevents synchronization issues and simplifies operations.

4. **Why Deterministic Engineering Tools in AI Agents?**  
   AI models can make arithmetic errors when calculating physics or building codes. We connected the AI agent to verified Python calculation tools:
   - `calculate_acoustic_performance`: Sound reduction index $R_w\text{ (dB)}$ under DIN 4109 acoustic principles.
   - `calculate_fire_resistance`: Fire resistance rating ($EI\text{ }30/60/90/120$) according to EN 13501-2.
   - `calculate_framing_bill_of_materials`: Exact stud, track, drywall board, screw, and compound quantities based on wall dimensions.

5. **Why Parallel Multi-Agent Plan Generation?**  
   Asking a single AI prompt to build 3 distinct options often produces repetitive results. Running 3 specialized sub-agents (*Budget*, *Balanced*, *Premium*) at the same time ensures distinct, well-reasoned choices with minimal wait time.

6. **Why Tiered Rate Limiting?**  
   Allows visitors to try the full experience immediately without signing up (1 plan build, 5 AI messages). Soft notifications encourage signing in to unlock saved projects and higher daily limits (10 plans, 100 messages).

---

## 5. Data Disclosure & Standards

- **Synthetic Data & Standards Modeling:** Products and regulatory knowledge documents are synthetically generated and modeled after official European building norms:
  - *Drywall:* `EN 520` (Types A, D, F, H1, I), `DIN 18180` (densities 680–1600 kg/m³).
  - *Insulation:* `EN 13162`, `DIN 4109` ($\lambda = 0.015\text{--}0.038\text{ W/mK}$).
  - *Metal Framing:* `EN 14195`, `DIN 18182-1` (galvanized steel gauges).
  - *Sealants/Fillers:* `EN 13963`, `EN 1366-3` (intumescent expansion ratios).
  - *Fasteners:* `EN 14566`, `ETA-11/0268` (pullout resistance).
- **Assets:** High-resolution architectural imagery curated from [Unsplash Open Collection](https://unsplash.com/).
- **Limitations:** Prices and delivery lead times are realistic market benchmarks for demonstration purposes.

---

## 6. UX & Resilience

- **Loading States:** Shimmering skeletons for catalog grids, animated questionnaire loaders, and smooth streaming text for AI answers.
- **Database 503 Guard:** Returns a clean service unavailable notice with retry headers if the database drops connection, while keeping health checks active.
- **Error Handling:** Helpful empty state messages with "Reset Filters" and clear rate limit modals.
- **Responsive Design:** 50/50 desktop split workspace adapts to mobile tab switchers; collapsible filter drawers on mobile.
- **Design System:** Clean industrial aesthetic (Deep Charcoal `#18181B`, Industrial Amber `#D97706`, 8pt grid, clean iconography).

---

## 7. AI Tools Disclosure

In accordance with assignment guidelines, AI tools were used for:
- Drafting realistic technical specifications and mock catalog items matching DIN/EN norms.
- Building the vector search pipeline and formatting knowledge base documents.
- Designing the multi-agent decision graph and calculation tools.
- Assisting in frontend layouts and code review (all outputs manually reviewed, tested, and validated).

---

## 8. Getting Started

### Quickstart with Docker Compose

1. **Clone & setup environment:**
   ```bash
   git clone https://github.com/pireu2/buildstack.git
   cd buildstack
   cp .env.example .env
   ```
2. **Configure `.env`** with your PostgreSQL (`DATABASE_URL`) and AI provider settings.
3. **Start backend services (NGINX, Express API, Python AI Service):**
   ```bash
   docker compose up --build
   ```
   *(The database will automatically run migrations and seed synthetic products and standards documents on first launch).*
4. **Start the Next.js frontend in a separate terminal:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open **[http://localhost:3000](http://localhost:3000)**.



