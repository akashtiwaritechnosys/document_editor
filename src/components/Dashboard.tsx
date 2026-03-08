'use client';

import { useState, useMemo } from 'react';
import { Document } from '@/lib/types';
import Link from 'next/link';
import { Search, PlusCircle, ArrowRight, Trash2, AlertTriangle, Folder, BookOpen, Layers } from 'lucide-react';
import { clearAllDocuments, removeSpace, removeDocument } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function Dashboard({ docs }: { docs: Document[] }) {
    const [search, setSearch] = useState('');
    const [isClearing, setIsClearing] = useState(false);
    const router = useRouter();

    const handleClearAll = async () => {
        if (confirm("🚨 WARNING 🚨\n\nAre you sure you want to PERMANENTLY delete ALL documentation? This action cannot be undone.")) {
            setIsClearing(true);
            await clearAllDocuments();
            setIsClearing(false);
            window.location.reload();
        }
    };

    const handleDeleteSpace = async (e: React.MouseEvent, space: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`Delete the entire "${space}" module and all its pages?`)) {
            await removeSpace(space);
            window.location.reload();
        }
    };

    const handleDeleteDoc = async (e: React.MouseEvent, id: string, title: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`Delete document "${title}"?`)) {
            await removeDocument(id);
            window.location.reload();
        }
    };

    // LOGIC: Distinguish between "Root Modules" (Documents) and "Nested Content" (Pages)
    // Root Level = Space names that do not match any existing document title.
    const allDocTitlesLower = useMemo(() => new Set(docs.map(d => d.title.trim().toLowerCase())), [docs]);

    const topLevelSpaces = useMemo(() => {
        const spacesSet = new Set<string>();
        docs.forEach(doc => {
            const space = (doc.space || 'General').trim();
            if (!allDocTitlesLower.has(space.toLowerCase())) {
                spacesSet.add(space);
            }
        });
        return Array.from(spacesSet).sort();
    }, [docs, allDocTitlesLower]);

    const filteredSearchResults = useMemo(() => {
        if (!search) return [];
        return docs.filter(doc =>
            doc.title.toLowerCase().includes(search.toLowerCase()) ||
            doc.space.toLowerCase().includes(search.toLowerCase())
        );
    }, [docs, search]);

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar font-sans relative z-10 p-8 md:p-16 flex flex-col items-center flex-1">

            <header className="text-center mb-16 max-w-4xl animate-[fadeInDown_1s_ease-out] w-full">
                <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-bold tracking-wider uppercase mb-6 backdrop-blur">
                    Knowledge Base
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text h-20">
                    Syllabus Hub
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed mb-10 font-light mx-auto">
                    Manage your primary documentation modules. Click a module to explore sub-pages and detailed tags.
                </p>

                <div className="flex flex-wrap gap-4 justify-center items-center mt-5">
                    <Link
                        href="/docs/new"
                        className="inline-flex items-center gap-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white px-10 py-4 rounded-2xl text-sm font-bold shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:shadow-[0_4px_30px_rgba(59,130,246,0.7)] hover:scale-105 transition-all active:scale-95"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Create New Module
                    </Link>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">

                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search everything..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-72 md:w-96 pl-14 pr-6 py-4 bg-slate-800/40 border border-white/10 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur font-medium"
                        />
                    </div>
                </div>

                {docs.length > 0 && (
                    <div className="mt-8 flex justify-center opacity-40 hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleClearAll}
                            disabled={isClearing}
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isClearing ? 'Purging Hub...' : 'Purge All Data'}
                        </button>
                    </div>
                )}
            </header>

            {search ? (
                /* Search View */
                <div className="w-full max-w-4xl animate-[fadeInUp_0.5s_ease-out]">
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                        <h2 className="text-2xl font-bold text-slate-200">Search Results ({filteredSearchResults.length})</h2>
                        <button onClick={() => setSearch('')} className="text-sm text-blue-400 hover:underline">Clear Search</button>
                    </div>

                    {filteredSearchResults.length === 0 ? (
                        <div className="text-center py-20 text-slate-500 italic">No matches found for "{search}"</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredSearchResults.map(doc => (
                                <Link key={doc.id} href={`/docs/${doc.id}`} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{doc.title}</h3>
                                            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">{doc.space}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={(e) => handleDeleteDoc(e, doc.id, doc.title)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Main Icon/Folder View */
                <div className="w-full max-w-7xl animate-[fadeInUp_1s_ease-out_0.3s_backwards]">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-3 tracking-tight">
                            <Layers className="w-6 h-6 text-blue-400" />
                            Primary Modules
                        </h2>
                    </div>

                    {topLevelSpaces.length === 0 ? (
                        <div className="p-20 bg-slate-800/20 backdrop-blur-xl border border-dashed border-white/10 rounded-[3rem] text-center">
                            <p className="text-xl text-slate-500 font-light italic">No documentation modules yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {topLevelSpaces.map((space, index) => {
                                const spaceDocs = docs.filter(d => (d.space || 'General') === space);
                                const firstDoc = spaceDocs[0];

                                // Cycle through icons for variety
                                const icons = [<Folder key="f" />, <BookOpen key="b" />, <Layers key="l" />];
                                const currentIcon = icons[index % icons.length];

                                return (
                                    <Link
                                        key={space}
                                        href={firstDoc ? `/docs/${firstDoc.id}` : '#'}
                                        className="group relative bg-[#1e293b]/50 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col transition-all duration-700 hover:-translate-y-4 hover:bg-[#1e293b]/80 hover:border-white/20 hover:shadow-[0_30px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.1)] overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />

                                        <div className="flex justify-between items-start mb-10">
                                            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:rotate-6 transition-all duration-700 border border-blue-500/10 group-hover:border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                                {currentIcon && typeof currentIcon === 'object' && 'props' in currentIcon ? (
                                                    <currentIcon.type {...currentIcon.props} className="w-10 h-10" />
                                                ) : <Folder className="w-10 h-10" />}
                                            </div>

                                            <button
                                                onClick={(e) => handleDeleteSpace(e, space)}
                                                className="p-3 bg-red-500/5 hover:bg-red-500/20 text-slate-600 hover:text-red-400 rounded-2xl transition-all border border-transparent hover:border-red-500/20 opacity-0 group-hover:opacity-100"
                                                title="Delete this module"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <h3 className="text-3xl font-black text-white mb-4 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                            {space}
                                        </h3>

                                        <p className="text-slate-400 text-[17px] leading-relaxed mb-12 font-light flex-1">
                                            Access the complete {space} curriculum. Includes {spaceDocs.length} core {spaceDocs.length === 1 ? 'page' : 'pages'} with comprehensive tags and sub-topics.
                                        </p>

                                        <div className="mt-auto flex items-center justify-between font-mono text-[12px] font-bold text-blue-400/50 group-hover:text-blue-400 tracking-[0.2em] uppercase transition-all">
                                            <span>Open Module</span>
                                            <ArrowRight className="w-5 h-5 transition-all duration-700 group-hover:translate-x-3" />
                                        </div>

                                        {/* Decorative element */}
                                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700"></div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
