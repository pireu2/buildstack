# BuildStack

> **An AI-first building materials discovery platform featuring a Guided Solution Builder and RAG Copilot.**

BuildStack is a next-generation materials discovery platform. Instead of navigating a passive catalog, users interact with an **Active AI Solution Architect** that uses a conversational wizard to generate tailored material plans and answer complex technical questions.

Built with Next.js, an Express/FastAPI split microservice architecture, and a PostgreSQL database.

---

## Features

- **Guided Solution Builder:** A dynamic, AI-driven wizard that asks context-aware follow-up questions to understand your build requirements.
- **AI Workspace:** Side-by-side comparison of AI-generated material plans with an interactive chat agent to refine options in real-time.
- **Contextual Catalog Chat:** Ask questions about specific materials directly on the product page.
- **Microservice Architecture:** NGINX reverse proxy routing between a high-speed Express.js core API and a compute-heavy Python FastAPI AI engine.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Core API:** Node.js, Express, TypeORM, PostgreSQL
- **AI Service:** Python, FastAPI, LangChain, Ollama (Local inference via Qwen 27B / Cloud LLMs)
- **Database:** PostgreSQL (with `pgvector` extension for embeddings)
- **Gateway & Infrastructure:** NGINX, Docker Compose

---

## Data Disclosure, Sources & Methodology

In compliance with the assignment requirements regarding data sourcing and AI tool usage, here is a detailed breakdown of how the product data and assets were produced:

### 1. Data Generation Methodology

The catalog dataset comprises realistic, specialized mock data synthesized using AI tools. To ensure genuine engineering validity and real-world applicability for architects and contractors, all physical values are directly modeled after official European building industry standards:

- **Gypsum & Drywall Boards:** Classified according to `EN 520` (Types A, D, F, H1, I, R) and `DIN 18180`, with accurate densities (680–1600 kg/m³), flexural breaking loads, Brinell hardness ratings, and water absorption classes.
- **Thermal & Acoustic Insulation:** Formulated under `EN 13162` and `DIN 4109`, featuring calibrated thermal conductivity ($\lambda = 0.015 - 0.038\text{ W/mK}$) and certified airflow resistivity ($10 - 15\text{ kPa}\cdot\text{s/m}^2$).
- **Metal Substructures & Framing:** Engineered according to `EN 14195` and `DIN 18182-1` (DX51D+Z galvanized steel gauges, moments of inertia, and knurled flanges).
- **Joint Fillers & Sealants:** Structured under `EN 13963` (Types 3A, 4B) and `EN 1366-3` (intumescent expansion ratios, setting times, and VOC metrics).
- **Fasteners & Ceiling Anchors:** Governed by `EN 14566` (fine/tek thread geometries) and `ETA-11/0268` (Option 1 cracked concrete pullout resistances).

### 2. Imagery & Asset Sourcing

Product imagery consists of high-resolution, neutral architectural and material texture photography curated from the [Unsplash Open Collection](https://unsplash.com/), selected for clean lighting, high resolution, and industrial realism.

### 3. Data Architecture Decisions & Limitations

- **Hybrid Relational/JSONB Storage:** Universal fields (`id`, `sku`, `name`, `price`, `unit`, `manufacturer`, `description`) are indexed as relational columns, while domain-specific engineering attributes (e.g. airflow resistivity for insulation, drill capacities for screws, intumescent swell ratios for mastics) reside inside polymorphic `jsonb` payloads.
- **RAG Chunks:** Every product record contains a pre-compiled `rag_chunk` specification block formatted specifically for dense semantic retrieval and Model Context Protocol (MCP) agent tool calls.
- **Limitations:** Prices (€/unit or €/m²) and lead times are representative market benchmarks for demonstration purposes.

---

## Getting Started for Reviewers

You have two options to review this project:

### 1. Test the Live Deployment (Recommended)

A fully functional live version of this platform is deployed at: **[Insert Vercel/Live Link Here]**

### 2. Run Locally (Docker Compose)

The entire microservice stack (NGINX, Express, Python) is containerized:

1. Clone the repository
2. Rename `.env.example` to `.env`
3. Run the backend services:
   ```bash
   docker compose up --build
   ```
   _(On first boot, TypeORM will automatically execute database migrations and seed the database)._
4. In a separate terminal, start the Next.js frontend:
   ```bash
   cd frontend
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.
