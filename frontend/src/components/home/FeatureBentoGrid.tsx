'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Bot,
  Layers,
  Calculator,
  ArrowRight,
  Cpu,
  ShieldAlert,
  Volume2,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';

export function FeatureBentoGrid() {
  return (
    <section id="features-section" className="py-24 bg-white border-t border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs font-semibold text-zinc-800 mb-4">
            <Cpu className="h-3.5 w-3.5 text-amber-600" />
            <span>Architectural Intelligence Platform</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-heading">
            Engineered for Precision Construction &amp; Specification
          </h2>
          <p className="text-base text-zinc-600 mt-3 leading-relaxed">
            Every material recommendation, acoustic calculation, and multi-tier assembly is strictly grounded in manufacturer technical data and certified European building standards.
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Hybrid Catalog Search */}
          <div className="p-7 rounded-2xl bg-zinc-50/70 border border-zinc-200/90 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="h-10 w-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-2xs">
                  <Search className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 bg-white px-2.5 py-1 rounded-lg border border-zinc-200/80 shadow-2xs">
                  Vector Embeddings + BM25
                </span>
              </div>
              <h3 className="text-xl font-bold text-zinc-950 font-heading">
                Hybrid Catalog Search &amp; Parametric Filters
              </h3>
              <p className="text-sm text-zinc-600 mt-2.5 leading-relaxed">
                Combines high-dimensional dense vector embeddings (<code className="text-xs bg-zinc-200/60 px-1 py-0.5 rounded font-mono text-zinc-800">pgvector</code>) with lexical keyword matching. Search by conceptual queries (e.g. <em>&quot;moisture-resistant ceiling for walk-in shower&quot;</em>) or exact product codes, with instant filtering across fire ratings (EI 30–120) and acoustic decibel ratings.
              </p>
            </div>

            {/* Visual Mini Comparison */}
            <div className="mt-6 pt-5 border-t border-zinc-200/60">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Vector Similarity</span>
                  <p className="font-semibold text-zinc-900 truncate">&ldquo;High soundproofing&rdquo;</p>
                  <p className="text-[11px] text-amber-600 font-medium mt-1">94.8% Match Score</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Lexical Match</span>
                  <p className="font-semibold text-zinc-900 truncate">Knauf Diamant 12.5mm</p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-1">Exact SKU Lookup</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Acoustic Specs</span>
                  <p className="font-semibold text-zinc-900 truncate">Rw = 58 dB Certified</p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-1">DIN 4109 Compliant</p>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-amber-600 transition-colors"
                >
                  <span>Explore Catalog Search</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Context-Aware AI Copilot */}
          <div className="p-7 rounded-2xl bg-zinc-50/70 border border-zinc-200/90 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="h-10 w-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-2xs">
                  <Bot className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 bg-white px-2.5 py-1 rounded-lg border border-zinc-200/80 shadow-2xs">
                  LangGraph ReAct Agent
                </span>
              </div>
              <h3 className="text-xl font-bold text-zinc-950 font-heading">
                Context-Aware AI Copilot
              </h3>
              <p className="text-sm text-zinc-600 mt-2.5 leading-relaxed">
                Seamlessly docked on every catalog product page and solution workspace. Automatically ingests active material specifications, dimensions, and manufacturer data to answer engineering questions and run live framing calculations.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-200/60 space-y-2.5">
              <div className="p-3 bg-white rounded-xl border border-zinc-200/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-zinc-800 font-medium truncate">Live Material Context Ingestion</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 shrink-0">Product State</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-zinc-200/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-zinc-800 font-medium truncate">Clean Markdown Product Links</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 shrink-0">/catalog/[slug]</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-zinc-200/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-zinc-800 font-medium truncate">Zero Conversational Fluff &amp; Tool Leaks</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 shrink-0">Engineering Output</span>
              </div>
            </div>
          </div>

          {/* Card 3: 3-Tier Solution Plan Generator */}
          <div className="p-7 rounded-2xl bg-zinc-50/70 border border-zinc-200/90 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="h-10 w-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-2xs">
                  <Layers className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 bg-white px-2.5 py-1 rounded-lg border border-zinc-200/80 shadow-2xs">
                  Multi-Agent Architecture
                </span>
              </div>
              <h3 className="text-xl font-bold text-zinc-950 font-heading">
                3-Tier Solution Plan Generator &amp; BOM Builder
              </h3>
              <p className="text-sm text-zinc-600 mt-2.5 leading-relaxed">
                Instantly engineers 3 distinct certified system assemblies: <strong>Budget Option</strong>, <strong>Balanced Standard</strong>, and <strong>Premium High-Performance</strong>. Each option delivers a complete bill of materials, estimated cost per m², acoustic ratings, and layer-by-layer specifications.
              </p>
            </div>

            {/* 3 Tier visual pill comparison */}
            <div className="mt-6 pt-5 border-t border-zinc-200/60">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-zinc-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Tier 1</span>
                    <span className="text-[10px] font-semibold text-zinc-900">Budget</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">Essential Compliance</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Value-engineered base build-up</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-amber-500/40 bg-amber-50/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-amber-600">Tier 2</span>
                    <span className="text-[10px] font-semibold text-amber-700">Balanced</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">Commercial Standard</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Optimal acoustic &amp; moisture balance</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-zinc-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Tier 3</span>
                    <span className="text-[10px] font-semibold text-zinc-900">Premium</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">Maximum Performance</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Heavy acoustic mass &amp; resilience</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Deterministic Tools for Exact Calculations */}
          <div className="p-7 rounded-2xl bg-zinc-50/70 border border-zinc-200/90 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="h-10 w-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-2xs">
                  <Calculator className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 bg-white px-2.5 py-1 rounded-lg border border-zinc-200/80 shadow-2xs">
                  Deterministic Physics &amp; Math
                </span>
              </div>
              <h3 className="text-xl font-bold text-zinc-950 font-heading">
                Deterministic Tools for Dynamic Queries
              </h3>
              <p className="text-sm text-zinc-600 mt-2.5 leading-relaxed">
                Rather than relying on speculative LLM estimates, BuildStack invokes deterministic calculation tools for exact framing bills of materials, acoustic mass-air-mass formulas, and certified fire ratings tailored to dynamic room dimensions.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-200/60 space-y-2.5">
              <div className="p-3 bg-white rounded-xl border border-zinc-200/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-zinc-900 font-semibold truncate">Framing BOM Calculator</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-600 shrink-0">CW Studs, Tracks &amp; Screws</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-zinc-200/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Volume2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-zinc-900 font-semibold truncate">DIN 4109 Acoustic Physics</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-600 shrink-0">Rw = 35–68 dB</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-zinc-200/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-zinc-900 font-semibold truncate">EN 13501-2 Fire Endurance</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-600 shrink-0">EI 30 to EI 120</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
