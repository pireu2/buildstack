'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  generateSolutionPlans,
  GeneratePlansResponse,
} from '@/lib/api/solutions';
import { OptionCard } from '@/components/solutions/OptionCard';
import { SolutionsChat } from '@/components/solutions/SolutionsChat';

function SolutionsContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get('query') || 'Project Solutions';
  const budget = searchParams.get('budget') || 'mid';
  const lengthM = parseFloat(searchParams.get('length') || '5.0');
  const heightM = parseFloat(searchParams.get('height') || '2.8');
  const moisture = searchParams.get('moisture') || 'dry';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plansData, setPlansData] = useState<GeneratePlansResponse | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('balanced');

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);

    let answers: Array<{ question: string; answer: string }> = [];
    try {
      const stored = sessionStorage.getItem('buildstack_intake_payload');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.answers && Array.isArray(parsed.answers)) {
          answers = parsed.answers;
        }
      }
    } catch (err) {
      console.warn('Session storage read warning:', err);
    }

    const payload = {
      prompt: query,
      budget,
      moisture_level: moisture,
      dimensions: { length_m: lengthM, height_m: heightM },
      answers,
    };

    try {
      const response = await generateSolutionPlans(payload);
      if (response && response.success && response.options?.length > 0) {
        setPlansData(response);
      } else {
        setError('Could not generate solution plans for this project. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [query]);

  const areaM2 = (lengthM * heightM).toFixed(1);

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50/60 flex flex-col">
      {/* 1. Slim Top Navigation Bar */}
      <header className="h-12 bg-white border-b border-zinc-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Project Intake</span>
        </Link>

        <span className="text-xs font-semibold text-zinc-800">
          BuildStack Solution Workspace
        </span>
      </header>

      {/* 2. Main Full-Screen Workspace */}
      <main className="flex-1 min-h-0 w-full p-3 sm:p-4 overflow-hidden flex flex-col">
        {/* Project Title and Specification Header */}
        <div className="shrink-0 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 font-heading">
              Engineered Solutions for &ldquo;{query}&rdquo;
            </h1>
            <p className="text-xs text-zinc-500 font-normal mt-0.5">
              Area: <strong className="font-semibold text-zinc-800">{areaM2} m²</strong> ({lengthM}m × {heightM}m) • Budget Tier: <span className="capitalize font-medium text-zinc-700">{budget}</span> • Moisture Condition: <span className="capitalize font-medium text-zinc-700">{moisture}</span>
            </p>
          </div>

          <Button
            disabled={isLoading || !selectedOptionId}
            onClick={() => {
              const selectedOption = plansData?.options?.find((o) => o.id === selectedOptionId);
              if (selectedOption) {
                sessionStorage.setItem('buildstack_selected_solution', JSON.stringify({
                  query,
                  dimensions: plansData?.dimensions,
                  selectedOption,
                }));
                // Proceed to catalog with selected items or project summary
                window.location.href = `/catalog?category=${selectedOption.products?.[0]?.category || 'drywall-systems'}`;
              }
            }}
            className="h-9 px-4 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-all"
          >
            <span>Proceed with Plan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* 3. Skeleton Loading State (Split View) */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-0 w-full">
            {/* Left: 3 Shimmer Option Rows */}
            <div className="flex flex-col gap-2.5 h-full min-h-0">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex-1 min-h-0 bg-white rounded-2xl border border-zinc-200 p-4 animate-pulse shadow-2xs flex flex-col justify-between"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center h-full">
                    <div className="md:col-span-5 space-y-2">
                      <div className="h-3 bg-zinc-200 rounded w-20" />
                      <div className="h-4 bg-zinc-200 rounded w-3/4" />
                      <div className="h-3 bg-zinc-100 rounded w-full" />
                    </div>
                    <div className="md:col-span-4 space-y-1.5 border-t md:border-t-0 md:border-l border-zinc-100 md:pl-3.5">
                      <div className="h-3 bg-zinc-200 rounded w-24 mb-1" />
                      <div className="h-6 bg-zinc-100 rounded" />
                      <div className="h-6 bg-zinc-100 rounded" />
                    </div>
                    <div className="md:col-span-3 space-y-2 border-t md:border-t-0 md:border-l border-zinc-100 md:pl-3.5">
                      <div className="h-10 bg-zinc-100 rounded-xl" />
                      <div className="h-7 bg-zinc-200 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Shimmer Chat Box */}
            <div className="h-full min-h-0 bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col justify-between animate-pulse shadow-2xs">
              <div className="space-y-2 border-b border-zinc-100 pb-4">
                <div className="h-4 bg-zinc-200 rounded w-48" />
                <div className="h-3 bg-zinc-100 rounded w-72" />
              </div>
              <div className="flex-1 my-4 space-y-3">
                <div className="h-14 bg-zinc-50 rounded-2xl w-3/4" />
                <div className="h-10 bg-zinc-100 rounded-2xl w-1/2 ml-auto" />
                <div className="h-16 bg-zinc-50 rounded-2xl w-4/5" />
              </div>
              <div className="h-10 bg-zinc-100 rounded-xl w-full" />
            </div>
          </div>
        )}

        {/* 4. Error State */}
        {!isLoading && error && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4 p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm my-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-950 font-heading">
                {error.includes('limit') ? 'Generation Limit Reached' : 'Unable to Generate Plans'}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-sm">
                {error}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {error.includes('Sign in') && (
                <Link
                  href="/auth/sign-in"
                  className="inline-flex items-center justify-center h-9 px-4 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 transition-colors shadow-2xs"
                >
                  Sign In for 10 Plans/Day
                </Link>
              )}
              <Button
                onClick={fetchPlans}
                size="sm"
                variant={error.includes('Sign in') ? 'outline' : 'default'}
                className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                <span>Retry</span>
              </Button>
            </div>
          </div>
        )}

        {/* 5. Full-Screen Split Layout: Left 50% = 3 Full-Height Option Rows, Right 50% = Full-Height Chat */}
        {!isLoading && plansData && plansData.options && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-0 w-full">
            {/* Left Side (50%): 3 Option Rows dividing full vertical height equally */}
            <div className="flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
              {plansData.options.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  areaM2={parseFloat(areaM2)}
                  isSelected={selectedOptionId === option.id}
                  onSelect={(opt) => setSelectedOptionId(opt.id)}
                />
              ))}
            </div>

            {/* Right Side (50%): Full-Height Chat Docked to Screen */}
            <div className="h-full min-h-0 overflow-hidden">
              <SolutionsChat
                query={query}
                dimensions={plansData.dimensions}
                options={plansData.options}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SolutionsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-zinc-50">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
            <span>Loading Solution Workspace...</span>
          </div>
        </div>
      }
    >
      <SolutionsContent />
    </Suspense>
  );
}
