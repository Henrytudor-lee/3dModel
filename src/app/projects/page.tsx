'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { Icons } from '@/components/ui/Icons';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, isGuest, loading, initialized, signOut } = useAuthStore();
  const { projects, sampleProjects, currentProject, loading: projectsLoading, fetchProjects, fetchSampleProjects, createProject, deleteProject, setCurrentProject } = useProjectStore();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (initialized && !loading) {
      if (!user || isGuest) {
        router.push('/login');
      } else {
        fetchProjects();
        fetchSampleProjects();
      }
    }
  }, [initialized, user, isGuest]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setCreating(true);
    const project = await createProject(newProjectName.trim());
    setCreating(false);
    if (project) {
      setShowNewProjectModal(false);
      setNewProjectName('');
      router.push('/workbench');
    }
  };

  const handleOpenProject = (project: typeof projects[0]) => {
    setCurrentProject(project);
    router.push('/workbench');
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!initialized || loading || projectsLoading) {
    return <LoadingScreen message="Loading Projects..." variant="dark" />;
  }

  return (
    <div className="h-full flex flex-col bg-[#0b1326] text-[#dae2fd] font-sans">
      {/* TopNavBar */}
      <nav className="bg-[#0b1326]/80 backdrop-blur-xl border-b border-[#3b494c]/10 text-[#00e5ff] font-medium flex justify-between items-center w-full px-8 h-16 shrink-0">
        <Link href="/"><img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" /></Link>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-slate-400 hover:text-[#00e5ff] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Projects</h1>
            <p className="text-[#bac9cc] text-sm">Manage and organize your 3D workspaces</p>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Icons.search /></span>
            <input
              className="bg-[#131b2e] border border-[#3b494c]/20 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#00e5ff]/50 w-48"
              placeholder="Search..."
              type="text"
            />
          </div>
        </div>

        {/* User Projects Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
              <svg className="w-5 h-5 text-[#00e5ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              My Projects
              <span className="text-sm font-normal text-slate-500">({projects.length})</span>
            </h2>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00e5ff] text-[#00363d] rounded-lg font-bold text-sm hover:brightness-110 transition-all"
            >
              <Icons.plus />
              Create New
            </button>
          </div>

          {/* User Project Cards - Horizontal Scroll */}
          {projects.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleOpenProject(project)}
                  className="group flex-shrink-0 w-72 bg-[#171f33] border border-[#3b494c]/10 rounded-2xl p-4 hover:border-[#00e5ff]/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-[#060e20]">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Icons.box />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="w-full bg-[#00e5ff] text-[#00363d] py-1.5 rounded-lg text-xs font-bold text-center">
                        Open
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-slate-100 font-bold truncate group-hover:text-[#00e5ff] transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-[#bac9cc] mt-1">
                        {project.scene_data?.objects?.length || 0} objects
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all flex-shrink-0"
                      title="Delete project"
                    >
                      <Icons.delete />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-[#171f33]/50 rounded-2xl border border-dashed border-[#3b494c]/30">
              <div className="mb-3 text-slate-500"><Icons.palette /></div>
              <p className="text-slate-400 text-sm mb-4">No projects yet</p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-4 py-2 bg-[#00e5ff] text-[#00363d] rounded-lg font-bold text-sm hover:brightness-110 transition-all"
              >
                Create First Project
              </button>
            </div>
          )}
        </div>

        {/* Sample Projects Section */}
        {sampleProjects.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-[#a855f7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Sample Projects
              <span className="text-sm font-normal text-slate-500">({sampleProjects.length})</span>
            </h2>

            {/* Sample Project Cards - Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
              {sampleProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleOpenProject(project)}
                  className="group flex-shrink-0 w-72 bg-[#1a1525] border border-[#a855f7]/20 rounded-2xl p-4 hover:border-[#a855f7]/40 transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#a855f7]/20 to-transparent rounded-bl-full" />

                  <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-[#0f0a15]">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Icons.box />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="w-full bg-[#a855f7] text-white py-1.5 rounded-lg text-xs font-bold text-center">
                        Open
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold text-[#a855f7] uppercase tracking-widest bg-[#a855f7]/20 px-2 py-1 rounded backdrop-blur-sm">
                        Sample
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-slate-100 font-bold truncate group-hover:text-[#a855f7] transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {project.description}
                      </p>
                    )}
                    <p className="text-xs text-[#bac9cc] mt-2">
                      {project.scene_data?.objects?.length || 0} objects
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#171f33] border border-[#3b494c]/20 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">Create New Project</h2>
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-[#060e20] border border-[#3b494c]/20 rounded-xl py-3 px-4 text-slate-100 focus:outline-none focus:border-[#00e5ff]/50"
                placeholder="My Awesome Project"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#3b494c]/30 text-slate-400 hover:text-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                className="flex-1 bg-[#00e5ff] text-[#00363d] py-3 rounded-xl font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
