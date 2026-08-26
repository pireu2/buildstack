import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { FeatureBentoGrid } from '@/components/home/FeatureBentoGrid';
import { WorkflowSection } from '@/components/home/WorkflowSection';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Full-Viewport Hero Section */}
        <HeroSection />

        {/* 1. Core Architectural Feature Bento Grid */}
        <FeatureBentoGrid />

        {/* 2. 4-Step Technical Workflow */}
        <WorkflowSection />
      </main>

      {/* Clean Footer with Terms & Conditions */}
      <Footer />
    </div>
  );
}
