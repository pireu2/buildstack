'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Volume2,
  ShieldAlert,
  Droplets,
  ChevronDown,
  DollarSign,
  Loader2,
  Ruler,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BimNodeGrid } from './BimNodeGrid';
import { fetchDynamicQuestions } from '@/lib/api/solutions';

const QUICK_PROMPTS = [
  {
    label: 'Kitchen Remodel',
    icon: Droplets,
    prompt: 'I want to remake my kitchen flooring with moisture protection and durable materials.',
    budget: 'mid',
    moistureLevel: 'moderate',
  },
  {
    label: 'Soundproof Bedroom Wall',
    icon: Volume2,
    prompt: 'I need a soundproof partition wall for a bedroom against outside traffic and neighbor noise.',
    budget: 'high',
    moistureLevel: 'dry',
  },
  {
    label: 'Fire-Safe Stairwell Wall',
    icon: ShieldAlert,
    prompt: 'Design a fire-resistant drywall partition assembly for a multi-family stairwell.',
    budget: 'mid',
    moistureLevel: 'dry',
  },
  {
    label: 'Bathroom / Spa Partition',
    icon: Droplets,
    prompt: 'I need a water-resistant wall assembly for a walk-in shower and bathroom renovation.',
    budget: 'high',
    moistureLevel: 'high',
  },
];

const BUDGET_OPTIONS = [
  { value: 'low', label: 'Budget-Friendly (Cost-effective essentials)' },
  { value: 'mid', label: 'Standard Quality (Durable, balanced value)' },
  { value: 'high', label: 'Premium Performance (High-end sound & finish)' },
];

const MOISTURE_OPTIONS = [
  { value: 'dry', label: 'Standard dry room (Living, bedroom, office)' },
  { value: 'moderate', label: 'Moderate moisture (Kitchen, laundry room)' },
  { value: 'high', label: 'High moisture & direct water (Bathroom, shower)' },
];

export function HeroSection() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // 3 STANDARD QUESTIONS (STACKED IN A SINGLE CARD)
  const [budget, setBudget] = useState('mid');
  const [wallLength, setWallLength] = useState('5.0');
  const [wallHeight, setWallHeight] = useState('2.8');
  const [moistureLevel, setMoistureLevel] = useState('dry');

  // EXACTLY 3 DYNAMIC QUESTIONS (STRINGS & ANSWERS)
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [lastFetchedPrompt, setLastFetchedPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger dynamic questions on defocus (onBlur)
  const handlePromptBlur = async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 4) return;
    if (trimmed === lastFetchedPrompt && dynamicQuestions.length > 0) return;

    setIsLoadingQuestions(true);
    setLastFetchedPrompt(trimmed);

    try {
      const questions = await fetchDynamicQuestions(trimmed, {
        budget,
        moisture_level: moistureLevel,
      });

      setDynamicQuestions(questions);
    } catch (err) {
      console.error('Error fetching dynamic questions:', err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const handleSelectQuickPrompt = (item: (typeof QUICK_PROMPTS)[0]) => {
    setPrompt(item.prompt);
    setBudget(item.budget);
    setMoistureLevel(item.moistureLevel);
    setIsExpanded(true);

    setIsLoadingQuestions(true);
    setLastFetchedPrompt(item.prompt);

    fetchDynamicQuestions(item.prompt, {
      budget: item.budget,
      moisture_level: item.moistureLevel,
    })
      .then((questions) => {
        setDynamicQuestions(questions);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingQuestions(false));
  };

  const canSubmit =
    prompt.trim().length >= 4 &&
    !isLoadingQuestions &&
    dynamicQuestions.length > 0 &&
    dynamicQuestions.every((_, idx) => (questionAnswers[idx] || '').trim().length > 0);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    const payload = {
      prompt: prompt.trim(),
      budget,
      moisture_level: moistureLevel,
      dimensions: {
        length_m: parseFloat(wallLength) || 5.0,
        height_m: parseFloat(wallHeight) || 2.8,
      },
      answers: dynamicQuestions.map((q, idx) => ({
        question: q,
        answer: questionAnswers[idx] || '',
      })),
    };

    try {
      sessionStorage.setItem('buildstack_intake_payload', JSON.stringify(payload));
    } catch (err) {
      console.warn('Could not write to sessionStorage:', err);
    }

    const queryParams = new URLSearchParams({
      query: prompt.trim(),
      budget,
      length: wallLength,
      height: wallHeight,
      moisture: moistureLevel,
    });

    router.push(`/solutions?${queryParams.toString()}`);
  };

  const scrollToCategories = () => {
    const el = document.getElementById('categories-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const parsedArea = (
    (parseFloat(wallLength) || 5.0) * (parseFloat(wallHeight) || 2.8)
  ).toFixed(1);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between items-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 pb-6 bg-white">
      {/* 1. Interactive Framing Grid Canvas */}
      <BimNodeGrid />

      {/* Spacer */}
      <div className="hidden sm:block h-6" />

      {/* 2. Main Hero Content */}
      <div className="relative w-full max-w-3xl mx-auto text-center my-auto z-10 py-6" ref={containerRef}>
        {/* Diffused Glow */}
        <div
          className="absolute -inset-x-20 -inset-y-16 -z-10 pointer-events-none rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255, 255, 255, 1) 35%, rgba(255, 255, 255, 0.85) 60%, rgba(255, 255, 255, 0) 85%)',
          }}
        />

        {/* Display Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-950 leading-[1.08]">
          Engineer your build <br className="hidden sm:block" />
          with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500">
            precision.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-zinc-700 leading-relaxed max-w-2xl mx-auto font-normal">
          Describe what you want to build or remodel. BuildStack helps you discover the right materials and assemblies for your space.
        </p>

        {/* 3. Expandable Intake Card */}
        <div className="w-full max-w-2xl mx-auto mt-8">
          <form
            onSubmit={handleSubmit}
            className={`group relative bg-white/95 backdrop-blur-2xl rounded-2xl border ${
              isExpanded
                ? 'border-amber-500 ring-4 ring-amber-500/10 shadow-2xl shadow-zinc-950/10'
                : 'border-zinc-200 shadow-xl shadow-zinc-950/[0.04] ring-1 ring-zinc-950/[0.03] hover:border-amber-400'
            } transition-all duration-300 p-5 sm:p-6 text-left`}
          >
            {/* Primary Project Request Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">
                Describe your project
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                onBlur={handlePromptBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={isExpanded ? 3 : 2}
                placeholder="e.g. I want to remake my kitchen flooring with waterproof backing, soundproof my bedroom, or build a home office wall..."
                className="w-full bg-transparent resize-none border-0 p-0 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-0 leading-relaxed font-normal"
              />
            </div>

            {/* EXPANDABLE CONTROLS SECTION */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden pt-5 border-t border-zinc-100 mt-4 space-y-6"
                >
                  {/* --- 3 STANDARD QUESTIONS (STACKED IN ONE CARD) --- */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-900">
                      General project details
                    </h3>

                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3.5">
                      {/* Standard 1: Budget Preference */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                          <span>Budget preference</span>
                        </label>
                        <select
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:border-amber-500 focus:outline-hidden cursor-pointer shadow-2xs"
                        >
                          {BUDGET_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Standard 2: Room / Wall Size */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                          <Ruler className="h-3.5 w-3.5 text-amber-600" />
                          <span>Approximate dimensions & area</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="50"
                              value={wallLength}
                              onChange={(e) => setWallLength(e.target.value)}
                              className="w-16 px-2 py-1.5 text-xs text-center font-medium bg-white border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-hidden shadow-2xs"
                            />
                            <span className="text-xs text-zinc-500">length (m)</span>
                          </div>
                          <span className="text-zinc-400 text-xs">×</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="10"
                              value={wallHeight}
                              onChange={(e) => setWallHeight(e.target.value)}
                              className="w-16 px-2 py-1.5 text-xs text-center font-medium bg-white border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-hidden shadow-2xs"
                            />
                            <span className="text-xs text-zinc-500">height / width (m)</span>
                          </div>
                          <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 ml-auto">
                            {parsedArea} m² total
                          </span>
                        </div>
                      </div>

                      {/* Standard 3: Water & Moisture Exposure */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                          <Droplets className="h-3.5 w-3.5 text-amber-600" />
                          <span>Water & moisture exposure</span>
                        </label>
                        <select
                          value={moistureLevel}
                          onChange={(e) => setMoistureLevel(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:border-amber-500 focus:outline-hidden cursor-pointer shadow-2xs"
                        >
                          {MOISTURE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* --- 3 DYNAMIC QUESTIONS (INPUT BOXES ONLY) --- */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                        <h3 className="text-xs font-semibold text-zinc-900">
                          Tailored project questions
                        </h3>
                        {isLoadingQuestions && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Generating 3 questions...</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400">
                        {dynamicQuestions.length > 0
                          ? `${dynamicQuestions.length} questions`
                          : 'Generated when you click outside description'}
                      </span>
                    </div>

                    {/* SKELETON LOADER WHILE DYNAMIC QUESTIONS ARE GENERATING */}
                    {isLoadingQuestions && (
                      <div className="space-y-3.5 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 animate-pulse">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="space-y-2">
                            <div className="h-4 bg-zinc-200 rounded w-3/4" />
                            <div className="h-9 bg-zinc-200 rounded-lg w-full" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* RENDERED 3 DYNAMIC QUESTIONS WITH INPUT BOXES */}
                    {!isLoadingQuestions && dynamicQuestions.length > 0 && (
                      <div className="space-y-3.5 p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200">
                        {dynamicQuestions.map((q, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <label className="block text-xs font-semibold text-zinc-900 leading-snug">
                              {idx + 1}. {q}
                            </label>

                            <input
                              type="text"
                              value={questionAnswers[idx] || ''}
                              onChange={(e) => handleAnswerChange(idx, e.target.value)}
                              placeholder="Type your answer..."
                              className="w-full px-3 py-2 text-xs font-normal bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hint placeholder when no questions yet */}
                    {!isLoadingQuestions && dynamicQuestions.length === 0 && (
                      <div className="p-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-center">
                        <p className="text-xs text-zinc-500">
                          {prompt.trim().length < 4
                            ? 'Type what you want to build or remodel above, then click outside the box to generate 3 tailored questions.'
                            : 'Click anywhere outside the text input to generate tailored questions for your project.'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Card Action Toolbar */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 hidden sm:inline-block">
                  {!isExpanded
                    ? 'Click to expand options'
                    : isLoadingQuestions
                    ? 'Generating tailored questions...'
                    : canSubmit
                    ? 'All questions answered — ready to build plan'
                    : 'Fill in answers above to build plan'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isExpanded && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  >
                    Collapse
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="h-10 px-5 text-sm font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-800 disabled:opacity-40 transition-all rounded-xl shadow-xs flex items-center gap-2 group/btn cursor-pointer"
                >
                  <span>
                    {isSubmitting
                      ? 'Building Plan...'
                      : isLoadingQuestions
                      ? 'Generating Questions...'
                      : 'Build Plan'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-amber-400 group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </div>
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
                  onClick={() => handleSelectQuickPrompt(item)}
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

      {/* 4. Bottom Viewport Anchor */}
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
