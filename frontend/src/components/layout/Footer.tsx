import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white py-8 text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded bg-zinc-900 flex items-center justify-center text-white">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-zinc-900">BuildStack</span>
          <span>© {currentYear} Duică Sebastian. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6 font-medium text-zinc-600">
          <Link href="/catalog" className="hover:text-zinc-950 transition-colors">
            Catalog
          </Link>
          <Link href="/projects" className="hover:text-zinc-950 transition-colors">
            Saved Projects
          </Link>
          <Link href="/terms" className="hover:text-zinc-950 transition-colors font-semibold text-zinc-800">
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
