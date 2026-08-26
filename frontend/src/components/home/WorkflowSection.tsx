'use client';

import React from 'react';
import {
  MessageSquareCode,
  Layers,
  LayoutDashboard,
  CheckCircle,
} from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Dynamic Project Intake',
    description:
      'Describe your partition wall, ceiling, or wet room in plain text. BuildStack analyzes room dimensions and generates dynamic engineering discovery questions.',
    icon: MessageSquareCode,
    badge: 'Zero-Shot Discovery',
  },
  {
    step: '02',
    title: '3-Tier Assembly Engineering',
    description:
      'Multi-agent AI synthesizes 3 certified build-up tiers (Budget, Balanced Standard, Premium Performance) with acoustic Rw ratings and price per m².',
    icon: Layers,
    badge: 'Multi-Agent Pipeline',
  },
  {
    step: '03',
    title: 'Single Plan Workspace',
    description:
      'Select your preferred solution and persist it to PostgreSQL. Access an architectural workspace with itemized bills of materials and layer build-ups.',
    icon: LayoutDashboard,
    badge: 'Saved Project State',
  },
  {
    step: '04',
    title: 'Architect Consultation & Sizing',
    description:
      'Chat directly with the AI Solution Architect for installation procedures, framing calculations (CW studs, UW tracks, screws), and DIN/EN compliance.',
    icon: CheckCircle,
    badge: 'Compliance & Sizing',
  },
];

export function WorkflowSection() {
  return (
    <section className="py-24 bg-zinc-50/50 border-t border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 block">
            Architectural Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-heading">
            From Plain-Text Intent to Certified Build-Up
          </h2>
          <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
            How BuildStack transforms room dimensions and project requirements into complete, standards-compliant material specifications.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs hover:shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-bold tracking-tight text-zinc-950 font-mono">
                      {item.step}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                      <Icon className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    {item.badge}
                  </span>
                  <h3 className="text-base font-bold text-zinc-950 font-heading mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
