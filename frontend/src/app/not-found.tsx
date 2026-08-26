import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Layers, ArrowLeft, Search, FolderGit2, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-lg w-full text-center space-y-6">
          {/* Visual 404 Badge */}
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-zinc-100 border border-zinc-200/80 shadow-2xs text-zinc-900 mx-auto">
            <span className="text-3xl font-black font-mono tracking-tight text-amber-600">404</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-heading">
              Specification Not Found
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-sm mx-auto">
              The requested catalog material, project blueprint, or workspace route does not exist or may have been relocated.
            </p>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-xs"
            >
              <HomeIcon className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>

            <Link
              href="/catalog"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 text-xs font-semibold rounded-xl bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 transition-all shadow-2xs"
            >
              <Search className="h-3.5 w-3.5 text-zinc-500" />
              <span>Browse Catalog</span>
            </Link>

            <Link
              href="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 text-xs font-semibold rounded-xl bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 transition-all shadow-2xs"
            >
              <FolderGit2 className="h-3.5 w-3.5 text-zinc-500" />
              <span>Saved Projects</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
