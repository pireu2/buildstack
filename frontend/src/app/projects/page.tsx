'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';
import { fetchUserProjects, deleteProject } from '@/lib/api/projects';
import { ProjectRecord } from '@/types/project';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Trash2,
  Layers,
  Sparkles,
  Lock,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session, isPending: isAuthPending } = authClient.useSession();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUserProjects(session.user.id);
      setProjects(data);
    } catch (err: any) {
      console.error('[ProjectsPage] Failed to load projects:', err);
      setError(err.message || 'Unable to load projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthPending) {
      if (session?.user?.id) {
        loadProjects();
      } else {
        setIsLoading(false);
      }
    }
  }, [session?.user?.id, isAuthPending]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user?.id) return;
    if (!window.confirm('Are you sure you want to delete this saved project plan?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteProject(id, session.user.id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error('[ProjectsPage] Delete error:', err);
      alert(err.message || 'Failed to delete project.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-foreground selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 font-heading">
              Saved Projects
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Manage and consult on your engineered material assemblies and specifications.
            </p>
          </div>

          {session?.user && (
            <Link href="/">
              <Button className="h-9 px-4 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 shadow-xs flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                <span>New Project Plan</span>
              </Button>
            </Link>
          )}
        </div>

        {/* 1. Unauthenticated Guest State */}
        {!isAuthPending && !session?.user && (
          <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-zinc-200 p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-700">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-950 font-heading">
              Sign In to View Saved Projects
            </h2>
            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
              Create an account or sign in to save your engineered material solutions, compare DIN/EN compliance, and consult with the AI Solution Architect.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/sign-in" className="w-full sm:w-auto">
                <Button className="w-full h-9 px-5 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 cursor-pointer">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full h-9 px-5 text-xs font-medium rounded-xl border-zinc-200 cursor-pointer">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 2. Loading State */}
        {(isLoading || isAuthPending) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse shadow-2xs space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-zinc-200 rounded w-1/2" />
                  <div className="h-3 bg-zinc-100 rounded w-16" />
                </div>
                <div className="h-3 bg-zinc-100 rounded w-3/4" />
                <div className="h-20 bg-zinc-50 rounded-xl border border-zinc-100" />
                <div className="h-8 bg-zinc-100 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* 3. Error State */}
        {!isLoading && session?.user && error && (
          <div className="max-w-md mx-auto my-10 bg-white rounded-2xl border border-zinc-200 p-6 text-center shadow-xs">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-950 font-heading">
              Failed to load projects
            </h3>
            <p className="text-xs text-zinc-600 mt-1">{error}</p>
            <Button
              onClick={loadProjects}
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl text-xs cursor-pointer"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* 4. Empty State */}
        {!isLoading && session?.user && !error && projects.length === 0 && (
          <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto mb-4 text-zinc-600">
              <FolderKanban className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-zinc-950 font-heading">
              No Saved Projects Yet
            </h2>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
              Start by describing your room, partition, or renovation goal. Our Solution Architect will engineer 3 certified material assemblies tailored to your dimensions.
            </p>
            <div className="mt-6">
              <Link href="/">
                <Button className="h-9 px-5 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Start Project Intake</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 5. Projects List Grid */}
        {!isLoading && session?.user && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => {
              const selectedOpt = project.data?.selected_option;
              const dims = project.data?.dimensions;
              const productsCount = selectedOpt?.products?.length || 0;
              const costPerM2 = selectedOpt?.pricing?.cost_per_m2 || 0;
              const totalCost = selectedOpt?.pricing?.total_estimated_cost || 0;
              const areaM2 = dims?.area_m2 || (dims?.length_m && dims?.height_m ? (dims.length_m * dims.height_m).toFixed(1) : '14.0');

              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
                >
                  {/* Top Header & Meta */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h2 className="text-base font-bold text-zinc-950 font-heading group-hover:text-amber-700 transition-colors line-clamp-1">
                        {project.title}
                      </h2>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {formatRelativeDate(project.updatedAt || project.createdAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(e, project.id)}
                          disabled={deletingId === project.id}
                          className="h-7 w-7 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete saved project"
                        >
                          {deletingId === project.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Meta Spec Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 mb-3.5">
                      <span className="font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {areaM2} m²
                      </span>
                      {dims?.length_m && dims?.height_m && (
                        <span>({dims.length_m}m × {dims.height_m}m)</span>
                      )}
                      {project.data?.moisture_level && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{project.data.moisture_level} Moisture</span>
                        </>
                      )}
                      {project.data?.budget && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{project.data.budget} Budget</span>
                        </>
                      )}
                    </div>

                    {/* Selected Assembly Highlight Box */}
                    {selectedOpt && (
                      <div className="bg-zinc-50/80 rounded-xl border border-zinc-200/70 p-3.5 mb-4">
                        <h3 className="text-xs font-semibold text-zinc-950 font-heading line-clamp-1">
                          {selectedOpt.title}
                        </h3>
                        <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {selectedOpt.tagline || selectedOpt.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer with Materials Count, Price, and Open Action */}
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-zinc-500">
                        {productsCount} Materials • {costPerM2.toFixed(2)} € / m²
                      </span>
                      <p className="font-semibold text-zinc-950">
                        Total: {totalCost.toFixed(2)} €
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-950 group-hover:text-amber-700 transition-colors">
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
