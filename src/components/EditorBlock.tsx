'use client';

import { Block } from '@/lib/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// === CUSTOM EDITORS ===

function parseTableMarkdown(content: string): string[][] {
    const lines = content.trim().split(/\r?\n/).filter(Boolean);
    const rows: string[][] = [];
    for (const line of lines) {
        if (/^\|[\s\-:|]+\|$/.test(line.trim())) continue; // skip separator
        const cells = line.split(/\s*\|\s*/).filter(c => c !== '').map(c => c.trim());
        if (cells.length) rows.push(cells);
    }
    return rows.length ? rows : [['', ''], ['', '']];
}

function toMarkdown(rows: string[][]): string {
    if (!rows.length) return '';
    const formatRow = (cells: string[]) => '| ' + cells.join(' | ') + ' |';
    const header = formatRow(rows[0]);
    const sep = '|' + Array(rows[0].length).fill('---').join('|') + '|';
    const body = rows.slice(1).map(formatRow).join('\n');
    return [header, sep, body].join('\n');
}

const TableBlockEditor = ({ block, updateBlock, onKeyDown }: any) => {
    const [rows, setRows] = useState<string[][]>(() =>
        block.content ? parseTableMarkdown(block.content) : [['', ''], ['', '']]
    );
    useEffect(() => {
        if (block.content) setRows(parseTableMarkdown(block.content));
    }, [block.content]);

    const save = (newRows: string[][]) => {
        setRows(newRows);
        updateBlock(block.id, { content: toMarkdown(newRows) });
    };

    const updateCell = (ri: number, ci: number, val: string) => {
        const next = rows.map((r, i) => {
            if (i !== ri) return r;
            const pad = Math.max(0, ci + 1 - r.length);
            const padded = [...r, ...Array(pad).fill('')];
            padded[ci] = val;
            return padded;
        });
        save(next);
    };

    const maxCols = Math.max(...rows.map(r => r.length), 1);
    const addRow = () => save([...rows, Array(maxCols).fill('')]);
    const addCol = () => save(rows.map(r => [...r, '']));
    const removeRow = () => rows.length > 1 && save(rows.slice(0, -1));
    const removeCol = () => rows[0].length > 1 && save(rows.map(r => r.slice(0, -1)));

    if (!block.content) {
        return (
            <div className="my-6 p-6 rounded-2xl border border-blue-500/20 bg-[#1e293b]/80">
                <p className="text-slate-400 text-sm font-medium mb-4">Choose table size</p>
                <div className="flex flex-wrap gap-3">
                    {[2, 3, 4, 5].map(n => (
                        <button
                            key={n}
                            onClick={() => {
                                const r = Array(n).fill(null).map(() => Array(n).fill(''));
                                r[0] = Array(n).fill(null).map((_, i) => `Col ${i + 1}`);
                                save(r);
                            }}
                            className="px-5 py-3 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 font-bold rounded-xl border border-blue-500/30 transition-all"
                        >
                            {n}×{n}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const normRows = rows.map(r => [...r, ...Array(maxCols - r.length).fill('')]);

    return (
        <div className="my-6 p-4 rounded-2xl border border-blue-500/20 bg-[#1e293b]/50" onKeyDown={e => onKeyDown(e, block.id)}>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <tbody>
                        {normRows.map((row, ri) => (
                            <tr key={ri}>
                                {row.map((cell, ci) => (
                                    <td key={ci} className="p-1">
                                        <input
                                            value={cell}
                                            onChange={e => updateCell(ri, ci, e.target.value)}
                                            placeholder={ri === 0 ? `Header ${ci + 1}` : ''}
                                            className="w-full min-w-[80px] px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={addRow} className="px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg border border-white/10">+ Row</button>
                <button onClick={addCol} className="px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg border border-white/10">+ Col</button>
                <button onClick={removeRow} className="px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg border border-white/10">− Row</button>
                <button onClick={removeCol} className="px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg border border-white/10">− Col</button>
            </div>
        </div>
    );
};

const ImageBlockEditor = ({ block, updateBlock, onKeyDown }: any) => {
    const data = (() => {
        try { return JSON.parse(block.content || '{}'); }
        catch { return { src: block.content }; }
    })();

    const updateData = (updates: any) => {
        updateBlock(block.id, { content: JSON.stringify({ ...data, ...updates }) });
    };

    const handleFileChange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => updateData({ src: ev.target?.result });
            reader.readAsDataURL(file);
        }
    };

    if (!data.src) {
        return (
            <div className="bg-slate-800/80 p-8 rounded-3xl border-2 border-dashed border-blue-500/30 flex flex-col items-center justify-center my-6 gap-4 hover:border-blue-500/60 hover:bg-slate-800 transition-all">
                <ImageIcon className="w-10 h-10 text-blue-500/50" />
                <div className="text-slate-400 font-medium">Click to upload an image</div>
                <input autoFocus type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 cursor-pointer outline-none" onKeyDown={e => onKeyDown(e, block.id)} />
            </div>
        );
    }

    return (
        <div className="my-6 bg-slate-900/50 p-6 rounded-3xl border border-blue-500/20 flex flex-col gap-6 shadow-2xl relative group/image">
            <div className="relative rounded-[2rem] overflow-hidden bg-black/40 flex items-center justify-center p-4">
                <img src={data.src} alt={data.alt} style={{ width: data.width, marginLeft: data.align === 'center' ? 'auto' : data.align === 'right' ? 'auto' : '0', marginRight: data.align === 'center' ? 'auto' : data.align === 'left' ? 'auto' : '0' }} className="max-h-[500px] object-contain rounded-xl shadow-2xl" />
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-white/5 opacity-50 group-hover/image:opacity-100 transition-opacity focus-within:opacity-100">
                <input type="text" placeholder="Caption (alt text)" value={data.alt || ''} onChange={e => updateData({ alt: e.target.value })} className="bg-[#0f172a] text-white text-sm px-4 py-2.5 rounded-xl flex-1 outline-none focus:ring-2 ring-blue-500/50 border border-white/5 placeholder:text-slate-500" onKeyDown={e => onKeyDown(e, block.id)} />

                <select value={data.width || '100%'} onChange={e => updateData({ width: e.target.value })} className="bg-[#0f172a] text-slate-300 font-medium text-sm px-4 py-2.5 rounded-xl outline-none border border-white/5 focus:ring-2 ring-blue-500/50">
                    <option value="100%">100% Width</option>
                    <option value="75%">75% Width</option>
                    <option value="50%">50% Width</option>
                    <option value="25%">25% Width</option>
                </select>

                <select value={data.align || 'center'} onChange={e => updateData({ align: e.target.value })} className="bg-[#0f172a] text-slate-300 font-medium text-sm px-4 py-2.5 rounded-xl outline-none border border-white/5 focus:ring-2 ring-blue-500/50">
                    <option value="left">Align Left</option>
                    <option value="center">Align Center</option>
                    <option value="right">Align Right</option>
                </select>

                <button onClick={() => updateData({ src: '' })} className="px-4 py-2.5 bg-red-500/10 text-red-500 font-bold rounded-xl text-sm hover:bg-red-500/20 border border-red-500/20 transition-colors">Replace</button>
            </div>
        </div>
    );
};

const LinkBlockEditor = ({ block, updateBlock, onKeyDown, type }: any) => {
    const data = (() => {
        try { return JSON.parse(block.content || '{}'); }
        catch { return { text: block.content, url: '' }; }
    })();

    const [isEditing, setIsEditing] = useState(!data.url && !data.text);
    const [tempText, setTempText] = useState(data.text || '');
    const [tempUrl, setTempUrl] = useState(data.url || '');

    const save = () => {
        updateBlock(block.id, { content: JSON.stringify({ text: tempText, url: tempUrl }) });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="relative my-6 bg-[#1e293b] p-6 rounded-3xl border border-blue-500/30 shadow-2xl flex gap-4 flex-col w-[400px]">
                <div className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    {type === 'prev_link' ? '← Setup Previous Link' : type === 'next_link' ? 'Setup Next Link →' : <><LinkIcon className="w-4 h-4 text-emerald-500" /> Setup Link</>}
                </div>
                <input autoFocus type="text" placeholder="Link Text (e.g. React Docs)" className="bg-[#0f172a] text-white text-[15px] px-4 py-3 rounded-xl outline-none focus:ring-2 ring-blue-500/50 border border-white/5 placeholder:text-slate-500 font-medium" value={tempText} onChange={e => setTempText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { document.getElementById(`url-input-${block.id}`)?.focus() } }} />
                <input id={`url-input-${block.id}`} type="text" placeholder="URL Target (e.g. https://react.dev)" className="bg-[#0f172a] text-white text-[15px] px-4 py-3 rounded-xl outline-none focus:ring-2 ring-blue-500/50 border border-white/5 placeholder:text-slate-500 font-medium" value={tempUrl} onChange={e => setTempUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { save() } }} />
                <div className="flex gap-3 justify-end mt-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-white/5 font-bold text-sm">Cancel</button>
                    <button onClick={save} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all hover:scale-105">Insert Link</button>
                </div>
            </div>
        );
    }

    let containerClass = "my-6 px-6 py-5 rounded-[2rem] border flex items-center gap-6 group backdrop-blur transition-all outline-none focus-within:ring-2 ";
    if (type === 'prev_link') containerClass += "bg-purple-500/5 border-purple-500/20 border-l-[8px] border-l-purple-500 focus-within:ring-purple-500/30 cursor-pointer";
    else if (type === 'next_link') containerClass += "bg-blue-500/5 border-blue-500/20 border-r-[8px] border-r-blue-500 justify-end focus-within:ring-blue-500/30 cursor-pointer";
    else containerClass += "bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20 focus-within:ring-emerald-500/30 cursor-text w-max max-w-full";

    return (
        <div className={containerClass} onClick={() => { if (type === 'prev_link' || type === 'next_link') setIsEditing(true); }} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsEditing(true); } else onKeyDown(e, block.id); }}>
            {type === 'prev_link' && <div className="text-purple-500 font-black text-2xl group-hover:-translate-x-2 transition-transform">←</div>}

            <div className={`flex flex-col gap-1.5 flex-1 min-w-0 ${type === 'next_link' ? 'items-end' : ''}`}>
                {type === 'link' ? (
                    <div className="flex items-center gap-4 w-full">
                        <LinkIcon className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform opacity-50 max-w-max flex-shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                            <input type="text" value={data.text || ''} onFocus={() => setIsEditing(true)} readOnly className="bg-transparent text-emerald-400 font-bold text-lg outline-none cursor-text truncate w-full" placeholder="Link Text" />
                            <input type="text" value={data.url || ''} onFocus={() => setIsEditing(true)} readOnly className="bg-transparent text-slate-500 font-medium text-[13px] tracking-wider outline-none cursor-text truncate w-full" placeholder="URL" />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={`text-[10px] uppercase tracking-[0.3em] font-black ${type === 'prev_link' ? 'text-purple-500/50' : 'text-blue-500/50'} mb-1`}>
                            {type === 'prev_link' ? 'Previous Topic' : 'Next Topic'}
                        </div>
                        <div className={`font-black text-xl lg:text-2xl truncate w-full ${type === 'prev_link' ? 'text-purple-300' : 'text-blue-300'} ${type === 'next_link' ? 'text-right' : ''}`}>
                            {data.text || 'Setup link'}
                        </div>
                        <div className={`text-slate-500 font-mono text-[11px] truncate w-full ${type === 'next_link' ? 'text-right' : ''}`}>
                            {data.url || '#'}
                        </div>
                    </>
                )}
            </div>

            {type === 'next_link' && <div className="text-blue-500 font-black text-2xl group-hover:translate-x-2 transition-transform">→</div>}

            {(type === 'prev_link' || type === 'next_link') && (
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="absolute -right-4 -top-4 bg-slate-800 text-white p-2 rounded-xl shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                    <span className="text-xs font-bold px-2">Edit</span>
                </button>
            )}
        </div>
    );
}

function getNumberIndex(blocks: Block[], blockIndex: number): number {
    let n = 1;
    for (let i = blockIndex - 1; i >= 0; i--) {
        if (blocks[i].type === 'number') n++;
        else break;
    }
    return n;
}

interface Props {
    block: Block;
    blocks?: Block[];
    blockIndex?: number;
    updateBlock: (id: string, updates: Partial<Block>) => void;
    deleteBlock: (id: string) => void;
    onOpenAddMenu?: (blockId: string, position: { x: number; y: number }) => void;
    onKeyDown: (e: React.KeyboardEvent, id: string) => void;
}

export default function EditorBlock({ block, blocks = [], blockIndex = 0, updateBlock, deleteBlock, onOpenAddMenu, onKeyDown }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const renderBlockActions = () => (
        <div className="absolute right-[-10px] top-[25px] flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 z-20 transition-opacity">
            {onOpenAddMenu && (
                <button
                    onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        onOpenAddMenu(block.id, { x: rect.left, y: rect.bottom + 4 });
                    }}
                    className="p-2 text-slate-500 hover:text-blue-400 bg-slate-800/80 border border-white/10 hover:border-blue-500/30 rounded-xl transition-all shadow-xl backdrop-blur hover:scale-110"
                    aria-label="Add block"
                    title="Add block"
                >
                    <Plus className="w-4 h-4" />
                </button>
            )}
            <button onClick={() => deleteBlock(block.id)} className="p-2 text-slate-500 hover:text-red-400 bg-slate-800/80 border border-white/10 hover:border-red-500/30 rounded-xl transition-all shadow-xl backdrop-blur hover:scale-110" aria-label="Delete block">
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [block.content]);

    let inputClass = "w-full focus:outline-none resize-none overflow-hidden bg-transparent ";
    let placeholder = "Type / for advanced commands...";
    let wrapperClass = "group flex items-start gap-4 py-1.5 -mx-4 pl-4 relative transition-all rounded-3xl hover:bg-white/5 border border-transparent";
    let containerClass = "flex-1 w-full relative group/block min-w-0 ";

    switch (block.type) {
        case 'h1':
            inputClass += "text-3xl md:text-5xl font-extrabold text-white leading-tight mt-6 md:mt-12 mb-3 placeholder:text-white/20 px-3";
            placeholder = "Header 1";
            break;
        case 'h2':
            inputClass += "text-2xl md:text-4xl font-bold text-slate-100 leading-snug mt-5 md:mt-10 mb-3 placeholder:text-white/20 px-3";
            placeholder = "Header 2";
            break;
        case 'h4':
            inputClass += "text-xl font-bold text-slate-200 mt-6 md:mt-8 mb-2 px-3";
            placeholder = "Header 4";
            break;
        case 'h5':
            inputClass += "text-lg font-bold text-slate-300 mt-5 mb-2 px-3";
            placeholder = "Header 5";
            break;
        case 'h6':
            inputClass += "text-base font-bold text-slate-400 mt-4 mb-2 px-3 uppercase tracking-wider";
            placeholder = "Header 6";
            break;
        case 'bullet':
            inputClass += "text-[18px] text-slate-300 pl-8 relative";
            containerClass += "before:content-['•'] before:absolute before:left-2 before:top-2 before:text-blue-500 before:font-bold before:text-xl";
            placeholder = "Bullet point...";
            break;
        case 'number':
            inputClass += "text-[18px] text-slate-300 pl-10 relative";
            containerClass += "relative";
            placeholder = "Numbered list item...";
            break;
        case 'table':
            return <div ref={setNodeRef} style={style} className={wrapperClass}><div className="absolute left-[-25px] top-[25px] p-2 opacity-0 group-hover:opacity-100 cursor-grab text-slate-500 hover:text-white bg-slate-800/80 border border-white/10 rounded-xl transition-all shadow-xl backdrop-blur z-20" {...attributes} {...listeners}><GripVertical className="w-5 h-5" /></div><div className={containerClass}><TableBlockEditor block={block} updateBlock={updateBlock} onKeyDown={onKeyDown} /></div>{renderBlockActions()}</div>;
        case 'image':
            return <div ref={setNodeRef} style={style} className={wrapperClass}><div className="absolute left-[-25px] top-[25px] p-2 opacity-0 group-hover:opacity-100 cursor-grab text-slate-500 hover:text-white bg-slate-800/80 border border-white/10 rounded-xl transition-all shadow-xl backdrop-blur z-20" {...attributes} {...listeners}><GripVertical className="w-5 h-5" /></div><div className={containerClass}><ImageBlockEditor block={block} updateBlock={updateBlock} onKeyDown={onKeyDown} /></div>{renderBlockActions()}</div>;
        case 'link':
        case 'prev_link':
        case 'next_link':
            return <div ref={setNodeRef} style={style} className={wrapperClass}><div className="absolute left-[-25px] top-[25px] p-2 opacity-0 group-hover:opacity-100 cursor-grab text-slate-500 hover:text-white bg-slate-800/80 border border-white/10 rounded-xl transition-all shadow-xl backdrop-blur z-20" {...attributes} {...listeners}><GripVertical className="w-5 h-5" /></div><div className={containerClass}><LinkBlockEditor block={block} updateBlock={updateBlock} onKeyDown={onKeyDown} type={block.type} /></div>{renderBlockActions()}</div>;
        case 'h3':
            inputClass += "text-3xl font-semibold text-slate-200 leading-snug mt-8 mb-3 placeholder:text-white/20 px-3";
            placeholder = "Header 3";
            break;
        case 'code':
            inputClass += "font-mono text-[15px] leading-relaxed text-blue-300 bg-[#0f172a]/80 backdrop-blur-2xl p-6 rounded-2xl shadow-xl border border-white/10 placeholder:text-blue-500/30";
            placeholder = "console.log('Deploy phase initiated');";
            containerClass += "my-5 px-3";
            break;
        case 'note':
            inputClass += "text-[18px] font-light text-blue-100/90 placeholder:text-blue-400/30 w-full";
            containerClass += "my-5 p-6 bg-blue-900/20 border-l-[4px] border-blue-500 rounded-r-3xl shadow-lg backdrop-blur mx-3";
            placeholder = "Feature flag information goes here...";
            break;
        case 'warning':
            inputClass += "text-[18px] font-light text-orange-100/90 placeholder:text-orange-400/30 w-full";
            containerClass += "my-5 p-6 bg-orange-900/20 border-l-[4px] border-orange-500 rounded-r-3xl shadow-lg backdrop-blur mx-3";
            placeholder = "Caution: Database migration required...";
            break;
        case 'example':
            inputClass += "font-mono text-[15px] leading-[34px] text-slate-300 placeholder:text-slate-500/50";
            containerClass += "my-5 p-8 bg-[rgba(30,41,59,0.5)] border border-white/5 rounded-[2rem] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur mx-3";
            placeholder = "const server = new Server();";
            break;
        case 'divider':
            inputClass += "hidden";
            containerClass += "my-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full";
            break;
        default:
            inputClass += "text-[19px] font-light text-slate-300 leading-relaxed placeholder:text-slate-600 px-3";
            break;
    }

    return (
        <div ref={setNodeRef} style={style} className={wrapperClass}>
            <div
                className="absolute left-[-25px] top-[25px] p-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white bg-slate-800/80 border border-white/10 rounded-xl transition-all shadow-xl backdrop-blur z-20 hover:scale-110"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="w-5 h-5" />
            </div>

            <div className={containerClass}>
                {block.type === 'number' && (
                    <div className="absolute left-0 top-2.5 min-w-[24px] text-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-sm font-bold text-blue-400">
                        {getNumberIndex(blocks, blockIndex)}
                    </div>
                )}
                {block.type !== 'divider' && (
                    <textarea
                        ref={textareaRef}
                        className={inputClass}
                        placeholder={placeholder}
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        onKeyDown={(e) => onKeyDown(e, block.id)}
                        rows={1}
                        autoFocus={block.type !== 'paragraph'}
                    />
                )}
            </div>

            {renderBlockActions()}
        </div>
    );
}
