'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trash2,
  FolderKanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';
import { fetchProjectById, updateProject, deleteProject } from '@/lib/api/projects';
import { ProjectChatMessage, ProjectRecord } from '@/types/project';
import { SolutionOption } from '@/lib/api/solutions';
import { ProjectSpecView } from '@/components/projects/ProjectSpecView';
import { ProjectChatView } from '@/components/projects/ProjectChatView';

interface ProjectWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectWorkspacePage({ params }: ProjectWorkspacePageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const { data: session, isPending: isAuthPending } = authClient.useSession();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [selectedOption, setSelectedOption] = useState<SolutionOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'spec' | 'chat'>('spec');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadProject() {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProjectById(projectId, session.user.id);
        if (data) {
          setProject(data);
          const initialOption =
            data.data?.selected_option ||
            data.data?.all_options?.[0] ||
            null;
          setSelectedOption(initialOption);
        } else {
          setError('Project not found or you do not have permission to view it.');
        }
      } catch (err: any) {
        console.error('[ProjectWorkspace] Failed to fetch project:', err);
        setError(err.message || 'Error loading project.');
      } finally {
        setIsLoading(false);
      }
    }

    if (!isAuthPending) {
      if (session?.user?.id) {
        loadProject();
      } else {
        setIsLoading(false);
      }
    }
  }, [projectId, session?.user?.id, isAuthPending]);

  const handlePersistMessages = async (newMessages: ProjectChatMessage[]) => {
    if (!project || !session?.user?.id) return;

    try {
      const updated = await updateProject(
        project.id,
        {
          data: {
            ...project.data,
            messages: newMessages,
          },
        },
        session.user.id
      );
      setProject(updated);
    } catch (err) {
      console.error('[ProjectWorkspace] Failed to persist messages:', err);
    }
  };

  const handleDelete = async () => {
    if (!project || !session?.user?.id) return;
    if (!window.confirm('Are you sure you want to delete this saved project?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProject(project.id, session.user.id);
      router.push('/projects');
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.');
      setIsDeleting(false);
    }
  };

  // 1. Auth check
  if (!isAuthPending && !session?.user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-700">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-zinc-950 font-heading">
            Authentication Required
          </h2>
          <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
            Please sign in to access your saved project plans and consult with the Solution Architect.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/auth/sign-in">
              <Button className="h-9 px-5 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 cursor-pointer">
                Sign In
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="h-9 px-4 text-xs font-medium rounded-xl border-zinc-200 cursor-pointer">
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading State (Full Screen 50/50 Shimmer matching /solutions)
  if (isLoading || isAuthPending) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-zinc-50/60 flex flex-col">
        <header className="h-12 bg-white border-b border-zinc-200 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="h-4 bg-zinc-200 rounded w-36 animate-pulse" />
          <div className="h-4 bg-zinc-200 rounded w-48 animate-pulse" />
        </header>

        <main className="flex-1 min-h-0 w-full p-3 sm:p-4 overflow-hidden flex flex-col">
          <div className="h-7 bg-zinc-200 rounded w-72 mb-3 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-0 w-full">
            <div className="h-full bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse shadow-2xs space-y-4">
              <div className="h-6 bg-zinc-200 rounded w-1/2" />
              <div className="h-16 bg-zinc-100 rounded-xl" />
              <div className="h-40 bg-zinc-50 rounded-xl" />
            </div>
            <div className="h-full bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-zinc-200 rounded w-48" />
                <div className="h-3 bg-zinc-100 rounded w-72" />
              </div>
              <div className="space-y-3 my-4">
                <div className="h-12 bg-zinc-50 rounded-xl w-3/4" />
                <div className="h-10 bg-zinc-100 rounded-xl w-1/2 ml-auto" />
              </div>
              <div className="h-10 bg-zinc-100 rounded-xl w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Error / 404 State
  if (error || !project || !selectedOption) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-700">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-zinc-950 font-heading">
            Project Not Found
          </h2>
          <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
            {error || 'The requested project could not be found.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/projects">
              <Button className="h-9 px-4 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 cursor-pointer">
                Return to Saved Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dims = project.data?.dimensions || { length_m: 5.0, height_m: 2.8, area_m2: 14.0 };
  const areaM2 = dims.area_m2 || parseFloat((dims.length_m * dims.height_m).toFixed(1));

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50/60 flex flex-col">
      {/* 1. Slim Top Navigation Bar (Identical style to /solutions) */}
      <header className="h-12 bg-white border-b border-zinc-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Saved Projects</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-800 hidden sm:inline-block">
            BuildStack Project Workspace
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
            title="Delete project"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </header>

      {/* 2. Main Full-Screen Workspace */}
      <main className="flex-1 min-h-0 w-full p-3 sm:p-4 overflow-hidden flex flex-col">
        {/* Project Header Bar */}
        <div className="shrink-0 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 font-heading line-clamp-1">
              {project.title}
            </h1>
            <p className="text-xs text-zinc-500 font-normal mt-0.5">
              Area: <strong className="font-semibold text-zinc-800">{areaM2} m²</strong> ({dims.length_m}m × {dims.height_m}m)
              {project.data?.budget && (
                <> • Budget: <span className="capitalize font-medium text-zinc-700">{project.data.budget}</span></>
              )}
              {project.data?.moisture_level && (
                <> • Moisture: <span className="capitalize font-medium text-zinc-700">{project.data.moisture_level}</span></>
              )}
            </p>
          </div>

          {/* Mobile Tab Switcher (< 1024px) */}
          <div className="lg:hidden flex items-center bg-zinc-200/80 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMobileTab('spec')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                mobileTab === 'spec'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600'
              }`}
            >
              Specification & BOM
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('chat')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                mobileTab === 'chat'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600'
              }`}
            >
              Architect Chat
            </button>
          </div>
        </div>

        {/* 3. Full-Height 50/50 Dual-Pane Grid (Desktop) / Tab-Switched (Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-0 w-full overflow-hidden">
          {/* Left Pane (50%): Selected Assembly Specification & BOM */}
          <div
            className={`h-full min-h-0 overflow-hidden ${
              mobileTab === 'spec' ? 'block' : 'hidden lg:block'
            }`}
          >
            <ProjectSpecView
              project={project}
              selectedOption={selectedOption}
            />
          </div>

          {/* Right Pane (50%): Solution Architect Consultation Chat */}
          <div
            className={`h-full min-h-0 overflow-hidden ${
              mobileTab === 'chat' ? 'block' : 'hidden lg:block'
            }`}
          >
            <ProjectChatView
              project={project}
              selectedOption={selectedOption}
              onPersistMessages={handlePersistMessages}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
