'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Block, BlockType, Document } from '@/lib/types';
import EditorBlock from './EditorBlock';
import SlashCommandMenu from './SlashCommandMenu';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Save, Eye, Edit2, CheckCircle, Trash2, Layers } from 'lucide-react';
import { createOrUpdateDocument, removeDocument } from '@/app/actions';
import { useRouter } from 'next/navigation';
import DocumentViewer from './DocumentViewer';

interface Props {
    initialDoc?: Document;
    allDocs?: Document[];
}

export default function DocumentEditor({ initialDoc, allDocs = [] }: Props) {
    const router = useRouter();
    const [doc, setDoc] = useState<Document>(initialDoc || {
        id: uuidv4(),
        title: '',
        space: 'General',
        blocks: [
            { id: uuidv4(), type: 'paragraph', content: '' }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [spaceDropdownOpen, setSpaceDropdownOpen] = useState(false);
    const [slashMenu, setSlashMenu] = useState<{ active: boolean; x: number; y: number; blockId: string | null; filter: string; mode: 'replace' | 'insert' }>({
        active: false,
        x: 0,
        y: 0,
        blockId: null,
        filter: '',
        mode: 'replace'
    });

    const updateDoc = (updates: Partial<Document>) => {
        setDoc(prev => ({ ...prev, ...updates, updatedAt: Date.now() }));
    };

    const updateBlock = (id: string, updates: Partial<Block>) => {
        setDoc(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b),
            updatedAt: Date.now()
        }));
    };

    const deleteBlock = (id: string) => {
        if (doc.blocks.length <= 1) return;
        setDoc(prev => ({
            ...prev,
            blocks: prev.blocks.filter(b => b.id !== id),
            updatedAt: Date.now()
        }));
    };

    const insertBlock = (afterId: string, type: BlockType = 'paragraph', content: string = '') => {
        const newBlock = { id: uuidv4(), type, content };
        const index = doc.blocks.findIndex(b => b.id === afterId);
        const newBlocks = [...doc.blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setDoc(prev => ({ ...prev, blocks: newBlocks, updatedAt: Date.now() }));
        return newBlock.id;
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setDoc((prev) => {
                const oldIndex = prev.blocks.findIndex((b) => b.id === active.id);
                const newIndex = prev.blocks.findIndex((b) => b.id === over?.id);
                return {
                    ...prev,
                    blocks: arrayMove(prev.blocks, oldIndex, newIndex),
                    updatedAt: Date.now()
                };
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
        const block = doc.blocks.find(b => b.id === blockId);
        if (!block) return;

        if (e.key === '/') {
            const blockElement = document.getElementById(`block-${blockId}`);
            if (blockElement) {
                const rect = blockElement.getBoundingClientRect();
                setSlashMenu({
                    active: true,
                    x: rect.left + 40,
                    y: rect.bottom,
                    blockId,
                    filter: '',
                    mode: 'replace'
                });
            }
        } else if (slashMenu.active) {
            if (e.key === 'Escape' || e.key === ' ') {
                setSlashMenu(prev => ({ ...prev, active: false }));
            } else if (e.key.length === 1) {
                setSlashMenu(prev => ({ ...prev, filter: prev.filter + e.key }));
            } else if (e.key === 'Backspace') {
                setSlashMenu(prev => ({ ...prev, filter: prev.filter.slice(0, -1) }));
                if (slashMenu.filter === '') {
                    setSlashMenu(prev => ({ ...prev, active: false }));
                }
            }
        }

        if (e.key === 'Enter' && !slashMenu.active && !e.shiftKey) {
            e.preventDefault();
            const currentBlockType = block.type;
            const nextType = (currentBlockType === 'bullet' || currentBlockType === 'number') ? currentBlockType : 'paragraph';
            insertBlock(blockId, nextType);
        }

        if (e.key === 'Backspace' && block.content === '' && doc.blocks.length > 1) {
            e.preventDefault();
            deleteBlock(blockId);
        }
    };

    const changeBlockType = (blockId: string, type: BlockType) => {
        const block = doc.blocks.find(b => b.id === blockId);
        const rawContent = block?.content.replace(/^\//, '') || '';
        const needsEmptyInit = ['table', 'image', 'link', 'prev_link', 'next_link'].includes(type);
        const content = needsEmptyInit ? '' : rawContent;
        updateBlock(blockId, { type, content });
        setSlashMenu(prev => ({ ...prev, active: false }));
    };

    const handleSlashMenuSelect = (type: BlockType) => {
        if (!slashMenu.blockId) return;
        if (slashMenu.mode === 'insert') {
            insertBlock(slashMenu.blockId, type);
        } else {
            changeBlockType(slashMenu.blockId, type);
        }
        setSlashMenu(prev => ({ ...prev, active: false }));
    };

    const openAddMenu = (blockId: string, position: { x: number; y: number }) => {
        setSlashMenu({ active: true, blockId, filter: '', mode: 'insert', x: position.x, y: position.y });
    };

    const handleDelete = async () => {
        if (confirm(`Permanently delete "${doc.title}"?`)) {
            setIsSaving(true);
            await removeDocument(doc.id);
            router.replace('/');
        }
    };

    const save = async () => {
        if (!doc.title.trim()) {
            alert('Please enter a document title.');
            return;
        }
        setIsSaving(true);
        await createOrUpdateDocument(doc);
        setIsSaving(false);

        if (!initialDoc) {
            router.replace(`/docs/${doc.id}`);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative font-sans text-slate-100 z-10 w-full text-[15px]">
            <SlashCommandMenu
                position={slashMenu.active ? { x: slashMenu.x, y: slashMenu.y } : null}
                filter={slashMenu.filter}
                onSelect={handleSlashMenuSelect}
                closeMenu={() => setSlashMenu(prev => ({ ...prev, active: false }))}
            />

            {/* Topbar */}
            <div className="sticky top-0 z-30 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-8 py-3 border-b border-white/10 bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl shadow-xl gap-2">
                <div className="flex items-center justify-end sm:justify-start gap-3 flex-1 min-w-0">
                    <div className="bg-blue-500/20 p-2 rounded-lg hidden sm:block">
                        <Layers className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="relative flex-1 max-w-[125px] sm:max-w-[240px]">
                        <input
                            type="text"
                            className="text-xs font-bold border border-white/10 bg-white/5 rounded-xl px-4 py-2 w-full text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                            placeholder="Assign Space"
                            value={doc.space}
                            onFocus={() => {
                                if (doc.space === 'General') updateDoc({ space: '' });
                                setSpaceDropdownOpen(true);
                            }}
                            onBlur={() => setTimeout(() => setSpaceDropdownOpen(false), 200)}
                            onChange={(e) => updateDoc({ space: e.target.value })}
                        />
                        {spaceDropdownOpen && allDocs && (
                            <div className="absolute top-full left-0 mt-2 w-60 sm:w-[240px] max-h-[40vh] overflow-y-auto bg-[#1e293b] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[100] overflow-x-hidden border-t-blue-500/30 custom-scrollbar">
                                <div className="px-3 py-2 border-b border-white/5 bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Parent Space</div>
                                {Array.from(new Set([
                                    ...allDocs.map(d => d.space).filter(Boolean),
                                    ...allDocs.map(d => d.title).filter(Boolean)
                                ]))
                                    .filter(s => s.toLowerCase().includes(doc.space.toLowerCase()))
                                    .sort()
                                    .map(itemName => (
                                        <div
                                            key={itemName}
                                            className="px-4 py-2 hover:bg-white/10 cursor-pointer text-[12px] font-bold text-slate-200 transition-colors border-b border-white/5 last:border-0 truncate"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                updateDoc({ space: itemName });
                                                setSpaceDropdownOpen(false);
                                            }}
                                        >
                                            {itemName}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {initialDoc && (
                        <button onClick={handleDelete} disabled={isSaving} className="p-2 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-all shadow-lg" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')} className="p-2 border border-blue-500/30 text-blue-300 rounded-xl hover:bg-blue-500/10 transition-all shadow-lg">
                        {mode === 'edit' ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                    <button onClick={save} disabled={isSaving} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-all">
                        {isSaving ? 'Saving...' : 'Publish'}
                    </button>
                </div>
            </div>

            {mode === 'edit' ? (
                <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-16 py-4 md:py-10 max-w-5xl mx-auto w-full custom-scrollbar">
                    <input
                        type="text"
                        className="w-full text-2xl md:text-5xl font-black text-white bg-transparent outline-none mb-4 md:mb-8 placeholder:text-white/10 p-2 focus:border-white/5 transition-all"
                        placeholder="Document Title"
                        value={doc.title}
                        onChange={e => updateDoc({ title: e.target.value })}
                    />

                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={doc.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                                {doc.blocks.map((block, idx) => (
                                    <div key={block.id} id={`block-${block.id}`} className='mb-2'>
                                        <EditorBlock
                                            block={block}
                                            blocks={doc.blocks}
                                            blockIndex={idx}
                                            updateBlock={updateBlock}
                                            deleteBlock={deleteBlock}
                                            onOpenAddMenu={openAddMenu}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            ) : (
                <div className="flex-1 min-h-0">
                    <DocumentViewer doc={doc} />
                </div>
            )}
        </div>
    );
}
