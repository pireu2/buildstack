'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const navLinks = [
    { href: '/catalog', label: 'Catalog' },
    { href: '/projects', label: 'Saved Projects' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs group-hover:bg-primary/90 transition-colors">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-foreground">
                BuildStack
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/catalog'
                  ? pathname.startsWith('/catalog')
                  : link.href === '/projects'
                  ? pathname.startsWith('/projects')
                  : pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-foreground bg-secondary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions / Auth */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-foreground">
                {session.user.name?.[0]?.toUpperCase() || (
                  <User className="h-4 w-4" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:inline-block">
                {session.user.name || session.user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => authClient.signOut()}
                className="text-xs h-8 ml-1 cursor-pointer"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center justify-center h-8 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
