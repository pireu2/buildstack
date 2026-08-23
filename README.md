#  BuildStack

> **An AI-first building materials discovery platform featuring a Guided Solution Builder and RAG Copilot.**

BuildStack is a next-gen materials discovery platform. Instead of navigating a passive catalog, users interact with an **Active AI Solution Architect** that uses a conversational wizard to generate tailored material plans and answer complex technical questions. 

Built with Next.js, an Express/FastAPI split microservice architecture, and Neon Serverless Postgres (`pgvector`).

##  Features

- **Guided Solution Builder:** A dynamic, AI-driven wizard that asks context-aware follow-up questions to understand your build requirements.
- **AI Workspace:** Side-by-side comparison of AI-generated material plans with an interactive chat agent to refine options in real-time.
- **Contextual Catalog Chat:** Ask questions about specific materials directly on the product page.
- **Microservice Architecture:** NGINX reverse proxy routing between a high-speed Express.js core API and a compute-heavy Python FastAPI AI engine.

##  Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Framer Motion
- **Core API:** Node.js, Express
- **AI Service:** Python, FastAPI, LangChain
- **Database:** Neon Serverless Postgres (with `pgvector` for unified relational & embedding data)
- **Deployment:** Docker Compose, Vercel

##  Getting Started

*(Development setup instructions coming soon...)*
