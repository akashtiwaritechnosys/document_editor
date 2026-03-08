'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Book, ChevronRight, Home, PlusCircle, ChevronDown, FolderOpen, Folder, FileText, Trash2, Menu } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Document } from '@/lib/types';
import { removeDocument } from '@/app/actions';

interface SidebarClientProps {
    docs: Document[];
}

function DocumentNode({
    doc,
    childrenMap,
    pathname,
}: {
    doc: Document;
    childrenMap: Record<string, Document[]>;
    pathname: string;
}) {
    const isActive = pathname === `/docs/${doc.id}`;
    const childrenKey = Object.keys(childrenMap).find(
        (k) => k.toLowerCase() === doc.title.trim().toLowerCase()
    );
    const children = childrenKey ? childrenMap[childrenKey] : [];

    // Auto-open if we are active or if we have children (default true for visibility)
    const [isOpen, setIsOpen] = useState(true);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${doc.title}"? This cannot be undone.`)) {
            await removeDocument(doc.id);
        }
    };

    return (
        <li className="relative mt-1">
            <div className={`absolute left-[-8px] top-4 w-3 h-px ${isActive ? 'bg-purple-400' : 'bg-white/10'}`} />
            <div className="flex items-center group">
                {children.length > 0 && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsOpen(!isOpen);
                        }}
                        className="mr-1 text-slate-500 hover:text-purple-400 transition-colors z-10"
                    >
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                )}
                {!children.length && (
                    <span className="w-2 mr-1" /> // Spacer for alignment when no children
                )}

                <Link
                    href={`/docs/${doc.id}`}
                    className={`flex-1 flex items-center justify-between gap-2 pr-2 ps-2 py-1 text-[14px] rounded-xl transition-all ${isActive
                        ? 'bg-purple-500/15 text-purple-300 font-bold border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] translate-x-1'
                        : 'text-slate-400 hover:text-slate-100 font-medium'
                        }`}
                >
                    <span className="truncate">{doc.title || 'Untitled'}</span>

                    <button
                        onClick={handleDelete}
                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 text-slate-500 hover:text-red-400 ${isActive ? 'opacity-100' : ''}`}
                        title="Delete Document"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </Link>
            </div>

            {children.length > 0 && (
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <ul className="pl-[20px] relative before:absolute before:inset-y-0 before:left-[4px] before:w-px before:bg-gradient-to-b before:from-white/10 before:to-transparent">
                        {children.map((childDoc) => (
                            <DocumentNode
                                key={childDoc.id}
                                doc={childDoc}
                                childrenMap={childrenMap}
                                pathname={pathname}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </li>
    );
}

export default function SidebarClient({ docs }: SidebarClientProps) {
    const pathname = usePathname();

    // 1. Group documents by their declared space string (case-insensitive mapping map)
    const childrenMap = useMemo(() => {
        const map: Record<string, Document[]> = {};
        docs.forEach((doc) => {
            const space = (doc.space || 'Uncategorized').trim();
            // preserve casing of first encountered, but group insensitively
            const existingKey = Object.keys(map).find((k) => k.toLowerCase() === space.toLowerCase());
            const keyToUse = existingKey || space;

            if (!map[keyToUse]) map[keyToUse] = [];
            map[keyToUse].push(doc);
        });
        return map;
    }, [docs]);

    // 2. Determine top-level folders: "spaces" that DO NOT match any existing document title exactly
    const topLevelKeys = useMemo(() => {
        const allDocTitlesLower = new Set(docs.map((d) => d.title.trim().toLowerCase()));
        return Object.keys(childrenMap)
            .filter((spaceKey) => !allDocTitlesLower.has(spaceKey.toLowerCase()))
            .sort();
    }, [childrenMap, docs]);

    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        topLevelKeys.forEach((key) => {
            initial[key] = true;
        });
        return initial;
    });

    const toggleFolder = (key: string) => {
        setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {!mobileOpen && (
                <div className="md:hidden fixed top-[15px] left-4 z-50">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-1 rounded-lg bg-slate-800 border border-white/10 text-white shadow-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            )}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
            <aside
                className={`
        fixed md:relative top-0 left-0 h-screen w-72
        bg-[rgba(30,41,59,0.95)] backdrop-blur-3xl
        border-r border-white/5
        flex flex-col
        transform transition-transform duration-300
        z-40
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
    `}
            >
                <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

                <div className="p-5 lg:p-7 border-b border-white/5">
                    <Link href="/" className="font-extrabold flex items-center gap-3 text-white text-xl tracking-tight transition-transform hover:scale-105 origin-left">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                            <Book className="w-5 h-5 text-white" />
                        </div>
                        <span>Syllabus Docs</span>
                    </Link>
                </div>
                <div className="md:hidden absolute top-4 right-4">
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5">
                    <Link
                        href="/"
                        className={`group flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all ${pathname === '/'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]'
                            : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
                            }`}
                    >
                        <Home className={`w-4 h-4 ${pathname === '/' ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'} transition-colors`} />
                        Dashboard
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-2 custom-scrollbar">
                    {topLevelKeys.map((folderName) => {
                        const isOpen = openFolders[folderName] ?? true;
                        return (
                            <div key={folderName} className="mb-4">
                                <button
                                    onClick={() => toggleFolder(folderName)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-[15px] font-bold text-slate-200 hover:bg-white/5 rounded-2xl group transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        {isOpen ? (
                                            <FolderOpen className="w-4 h-4 text-purple-400" />
                                        ) : (
                                            <Folder className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                                        )}
                                        {folderName}
                                    </div>
                                    {isOpen ? (
                                        <ChevronDown className="w-4 h-4 text-slate-500 transition-transform" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-500 transition-transform" />
                                    )}
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                                >
                                    <ul className="pl-[26px] relative before:absolute before:inset-y-0 before:left-[18px] before:w-px before:bg-gradient-to-b before:from-white/10 before:to-transparent">
                                        {childrenMap[folderName].map((doc) => (
                                            <DocumentNode
                                                key={doc.id}
                                                doc={doc}
                                                childrenMap={childrenMap}
                                                pathname={pathname}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 border-t border-white/5 bg-[rgba(15,23,42,0.4)]">
                    <Link
                        href="/docs/new"
                        className="flex items-center justify-center gap-3 p-3.5 rounded-2xl border border-dashed border-white/20 hover:border-blue-500 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all group"
                    >
                        <div className="bg-slate-800 group-hover:bg-blue-500/20 p-1.5 rounded-lg transition-colors">
                            <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <span className="text-[15px] font-bold text-slate-300 group-hover:text-blue-300">Create Page</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
