import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, AlertTriangle, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions — BuildStack',
  description: 'Proof of Concept demonstration terms and disclaimer for the BuildStack platform by Duică Sebastian.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors mb-8 cursor-pointer group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Page Header */}
        <div className="border-b border-zinc-200 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs font-semibold text-zinc-800 mb-3">
            <Scale className="h-3.5 w-3.5 text-amber-600" />
            <span>Proof of Concept Disclaimer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-heading">
            Terms &amp; Demonstration Notice
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            BuildStack Project • Author: Duică Sebastian
          </p>
        </div>

        {/* Highlight Alert Box */}
        <div className="p-4 sm:p-5 bg-amber-50/70 rounded-2xl border border-amber-200/90 text-xs text-amber-900 mb-8 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>Demo &amp; Proof of Concept Only</span>
          </div>
          <p className="leading-relaxed text-amber-900/90">
            BuildStack is a technology demonstration and architectural portfolio prototype created by <strong>Duică Sebastian</strong>. All material specifications, catalog listings, pricing figures, and AI-generated calculations are synthetic and provided strictly for conceptual testing and evaluation.
          </p>
        </div>

        {/* Concise Terms Content */}
        <div className="space-y-7 text-xs text-zinc-700 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950 font-heading">
              1. Synthetic &amp; Simulated Data
            </h2>
            <p>
              The products, manufacturers, unit prices, technical dimensions, acoustic decibel ratings (Rw), and fire endurance classifications displayed across the catalog and solution generator are synthetic or compiled solely for demonstration. They must not be relied upon as certified manufacturer quotes or real-time warehouse inventory.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950 font-heading">
              2. Not for Physical Construction Use
            </h2>
            <p>
              No calculations, bills of materials (BOMs), fastener distributions, or architectural recommendations provided by this application should be used for real-world physical construction, structural engineering, procurement, or legal building code submissions. Always consult licensed structural engineers and certified building contractors for active construction projects.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950 font-heading">
              3. No Commercial Liability &amp; As-Is Use
            </h2>
            <p>
              This software is provided &ldquo;as is&rdquo; without warranty of any kind, express or implied. The author (Duică Sebastian) assumes no liability or responsibility for errors, omissions, or any real-world decisions made based on the simulated outputs of this prototype.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950 font-heading">
              4. Intellectual Property
            </h2>
            <p>
              The user interface, architecture, agentic graph orchestration, and code implementation of the BuildStack platform are the original work of <strong>Duică Sebastian</strong>. Referenced standard designations (e.g., DIN, EN) and manufacturer trademarks remain the property of their respective owners.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
