'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Volume2,
  ShieldAlert,
  Droplets,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BimNodeGrid } from './BimNodeGrid';

const QUICK_PROMPTS = [
  {
    label: '52dB Acoustic Studio Wall',
    icon: Volume2,
    prompt:
      'I need a 52dB acoustic partition wall for a podcast recording studio with sound isolation.',
  },
  {
    label: 'EI 60 Fire-Rated Shaft',
    icon: ShieldAlert,
    prompt:
      'Design an EI 60 fire-resistant drywall shaft wall assembly for a multi-family stairwell.',
  },
  {
    label: 'Moisture-Resistant Spa Ceiling',
    icon: Droplets,
    prompt:
      'Recommend a high-moisture resistant ceiling and wall board system for a commercial spa.',
  },
  {
    label: 'Acoustic Floor Underlay',
    icon: Layers,
    prompt:
      'Plan an impact sound insulation floor system for an apartment renovation over timber joists.',
  },
];

export function HeroSection() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    router.push(`/solutions?query=${encodeURIComponent(prompt.trim())}`);
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const scrollToCategories = () => {
    const el = document.getElementById('categories-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between items-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 pb-6 bg-white">
      {/* 1. Interactive BIM Node & Framing Grid Canvas */}
      <BimNodeGrid />

      {/* Spacer to push content to optical center */}
      <div className="hidden sm:block h-6" />

      {/* 2. Main Centered Hero Content with Diffused White Radial Transition */}
      <div className="relative w-full max-w-3xl mx-auto text-center my-auto z-10 py-6">
        {/* Smooth Radial White Halo Behind Headline and Input */}
        <div
          className="absolute -inset-x-20 -inset-y-16 -z-10 pointer-events-none rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255, 255, 255, 1) 35%, rgba(255, 255, 255, 0.85) 60%, rgba(255, 255, 255, 0) 85%)',
          }}
        />

        {/* Display Headline with Gradient Flare */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-950 leading-[1.08]">
          Engineer your build <br className="hidden sm:block" />
          with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500">
            precision.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-xl text-zinc-700 leading-relaxed max-w-2xl mx-auto font-normal">
          Describe your acoustic, fire-safety, or structural requirements.
          BuildStack generates certified multi-layer material assemblies in
          seconds.
        </p>

        {/* 3. Floating Bespoke Prompt Input Card */}
        <div className="w-full max-w-2xl mx-auto mt-8 sm:mt-10">
          <form
            onSubmit={handleSubmit}
            className="group relative bg-white/95 backdrop-blur-2xl rounded-2xl border border-zinc-200/90 shadow-2xl shadow-zinc-950/[0.04] ring-1 ring-zinc-950/[0.03] hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/20 transition-all p-4 sm:p-5 text-left"
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={3}
              placeholder="Ask BuildStack to engineer a material plan (e.g. 52dB soundproof studio wall, EI 60 fire shaft, moisture-proof ceiling)..."
              className="w-full bg-transparent resize-none border-0 p-0 text-sm sm:text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-0 leading-relaxed font-normal"
            />

            {/* Card Toolbar */}
            <div className="flex items-center justify-between pt-3.5 border-t border-zinc-100/90">
              <span className="text-xs text-zinc-400 font-mono">
                Press Enter to generate
              </span>

              <Button
                type="submit"
                disabled={!prompt.trim() || isSubmitting}
                className="h-10 px-5 text-sm font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-800 disabled:opacity-40 transition-all rounded-xl shadow-xs flex items-center gap-2 group/btn cursor-pointer"
              >
                <span>{isSubmitting ? 'Architecting...' : 'Build Plan'}</span>
                <ArrowRight className="h-4 w-4 text-amber-400 group-hover/btn:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </form>

          {/* Quick-Start Suggestion Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-zinc-500 font-medium mr-1 hidden sm:inline-block">
              Quick starts:
            </span>
            {QUICK_PROMPTS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSelectPrompt(item.prompt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/90 hover:bg-white text-zinc-800 hover:text-zinc-950 border border-zinc-200/90 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <Icon className="h-3.5 w-3.5 text-amber-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Bottom Viewport Anchor / Scroll Down Indicator */}
      <div className="w-full flex justify-center py-2 z-10">
        <button
          type="button"
          onClick={scrollToCategories}
          className="group flex flex-col items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <span>Explore certified materials catalog</span>
          <ChevronDown className="h-4 w-4 animate-bounce text-amber-600 group-hover:text-amber-700 transition-colors" />
        </button>
      </div>
    </section>
  );
}
