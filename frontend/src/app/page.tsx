import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryTicker } from '@/components/home/CategoryTicker';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Full-Viewport Hero Section */}
        <HeroSection />

        {/* Categories Section (Below the fold) */}
        <CategoryTicker />
      </main>

      {/* Enterprise Architectural Footer */}
      <footer className="border-t border-zinc-200 bg-white py-10 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded bg-zinc-900 flex items-center justify-center text-white">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-zinc-900">BuildStack</span>
            <span>— Certified Architectural Material Discovery</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/catalog" className="hover:text-zinc-900 transition-colors">
              Catalog
            </Link>
            <Link href="/solutions" className="hover:text-zinc-900 transition-colors">
              Solution Architect
            </Link>
            <Link href="/projects" className="hover:text-zinc-900 transition-colors">
              Saved Projects
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
