'use client';

import { Document, Block } from '@/lib/types';
import { parse } from 'marked';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { Download, FileDown, FileText, Trash2, Link as LinkIcon, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { removeDocument } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface Props {
    doc: Document;
}

export default function DocumentViewer({ doc }: Props) {
    const [htmlContent, setHtmlContent] = useState<Record<string, string>>({});
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
            await removeDocument(doc.id);
            router.replace('/');
        }
    };

    useEffect(() => {
        const processBlocks = async () => {
            const sanitized: Record<string, string> = {};
            for (const block of doc.blocks) {
                if (['paragraph', 'note', 'warning', 'example', 'bullet', 'number', 'table'].includes(block.type)) {
                    const rawMarkup = await parse(block.content, { async: true });
                    sanitized[block.id] = DOMPurify.sanitize(rawMarkup);
                } else {
                    sanitized[block.id] = block.content;
                }
            }
            setHtmlContent(sanitized);
        };
        processBlocks();
    }, [doc.blocks]);

    const toc = doc.blocks.filter(b => ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(b.type));

    const exportDocument = (format: 'html' | 'markdown' | 'json') => {
        let contentStr = '';
        let mime = 'text/plain';
        let ext = '.txt';

        if (format === 'json') {
            contentStr = JSON.stringify(doc, null, 2);
            mime = 'application/json';
            ext = '.json';
        } else if (format === 'markdown') {
            contentStr = doc.blocks.map(b => b.content).join('\n\n');
            mime = 'text/markdown';
            ext = '.md';
        } else {
            contentStr = `<html><body><h1>${doc.title}</h1></body></html>`;
            mime = 'text/html';
            ext = '.html';
        }

        const blob = new Blob([contentStr], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title.replace(/\s+/g, '_').toLowerCase()}${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const [tocOpen, setTocOpen] = useState(false);
    return (
        <div className="flex w-full h-full relative z-10 text-slate-200">
            {tocOpen && (
                <button
                    onClick={() => setTocOpen(false)}
                    className="hidden lg:flex fixed right-80 top-24 z-40 items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-white/10 text-white shadow-lg hover:bg-blue-500/20 transition-all"
                    title="Hide Panel"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
            )}

            {!tocOpen && (
                <button
                    onClick={() => setTocOpen(true)}
                    className="hidden lg:flex fixed right-4 top-24 z-40 items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-white/10 text-white shadow-lg hover:bg-blue-500/20 transition-all"
                    title="Show Panel"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
            )}

            <div className={`flex-1 overflow-y-auto px-8 py-16 xl:px-16 mx-auto w-full font-sans custom-scrollbar transition-all duration-300 
${tocOpen ? 'max-w-5xl' : 'max-w-6xl'}`}>
                <div className="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    {doc.space}
                </div>

                <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                    {doc.title}
                </h1>

                <div className="flex items-center gap-3 text-sm text-slate-400 mb-14 pb-8 border-b border-white/10 font-mono tracking-wide">
                    <span>{new Date(doc.updatedAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="text-blue-500/50">•</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Published</span>
                </div>

                <div className="space-y-8 prose prose-invert prose-lg prose-blue max-w-none prose-headings:font-extrabold prose-a:text-blue-400 hover:prose-a:text-blue-300">
                    {doc.blocks.map(block => {
                        const content = htmlContent[block.id] || block.content;

                        switch (block.type) {
                            case 'h1':
                                return <h1 key={block.id} id={block.id} className="text-4xl mt-16 mb-6 text-white">{block.content}</h1>;
                            case 'h2':
                                return <h2 key={block.id} id={block.id} className="text-3xl mt-12 mb-5 text-slate-100">{block.content}</h2>;
                            case 'h3':
                                return <h3 key={block.id} id={block.id} className="text-2xl mt-10 mb-5 text-slate-200">{block.content}</h3>;
                            case 'h4':
                                return <h4 key={block.id} id={block.id} className="text-xl mt-8 mb-4 text-slate-300 font-bold">{block.content}</h4>;
                            case 'h5':
                                return <h5 key={block.id} id={block.id} className="text-lg mt-6 mb-3 text-slate-400 font-bold">{block.content}</h5>;
                            case 'h6':
                                return <h6 key={block.id} id={block.id} className="text-base mt-4 mb-2 text-slate-500 font-bold uppercase tracking-[0.2em]">{block.content}</h6>;
                            case 'bullet':
                                return (
                                    <div key={block.id} className="my-2 pl-8 relative flex items-start group">
                                        <div className="absolute left-[3px] top-[14px] w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors"></div>
                                        <div className="text-slate-300 text-lg leading-relaxed font-light bullet-list" dangerouslySetInnerHTML={{ __html: content }} />
                                    </div>
                                );

                            case 'number':
                                return (
                                    <div key={block.id} className="my-2 pl-10 relative flex items-start group">
                                        <div className="absolute left-0 top-[6px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-[10px] text-blue-400/80 group-hover:text-blue-400 transition-colors uppercase">Step</div>
                                        <div className="text-slate-300 text-lg leading-relaxed font-light number-list" dangerouslySetInnerHTML={{ __html: content }} />
                                    </div>
                                );

                            case 'table':
                                return (
                                    <div key={block.id} className="my-10 overflow-x-auto rounded-3xl border border-white/10 shadow-2xl bg-[#1e293b]/50 backdrop-blur-3xl overflow-hidden p-6">
                                        <div className="prose-table:border-collapse prose-th:px-6 prose-th:py-4 prose-th:bg-blue-500/10 prose-th:text-blue-400 prose-th:font-black prose-th:uppercase prose-th:tracking-widest prose-th:text-[10px] prose-td:px-6 prose-td:py-5 prose-td:border-t prose-td:border-white/5 prose-td:text-slate-300" dangerouslySetInnerHTML={{ __html: content }} />
                                    </div>
                                );
                            case 'image': {
                                const imgData = (() => { try { return JSON.parse(block.content); } catch { return { src: block.content, alt: '', width: '100%', align: 'center' }; } })();
                                return (
                                    <div key={block.id} className="my-12 group relative overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl bg-slate-900/50" style={{ maxWidth: imgData.width !== '100%' ? imgData.width : 'none', margin: `${imgData.align === 'center' ? 'auto' : '0'}`, marginLeft: imgData.align === 'right' ? 'auto' : imgData.align === 'center' ? 'auto' : '0', marginRight: imgData.align === 'left' ? 'auto' : imgData.align === 'center' ? 'auto' : '0' }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 flex flex-col justify-end p-10">
                                            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full inline-flex items-center gap-2 self-start transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                <ImageIcon className="w-4 h-4 text-white" />
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Documentation Asset</span>
                                            </div>
                                        </div>
                                        <img src={imgData.src} alt={imgData.alt || "Image asset"} className="w-full h-auto object-cover max-h-[700px] group-hover:scale-[1.03] transition-transform duration-1000" />
                                        {imgData.alt && (
                                            <div className="absolute bottom-10 inset-x-0 text-center text-white/80 text-sm font-bold tracking-wider uppercase z-20 drop-shadow-lg">
                                                {imgData.alt}
                                            </div>
                                        )}
                                        {!imgData.src?.startsWith('http') && !imgData.src?.startsWith('data:') && (
                                            <div className="p-12 text-center text-slate-500 border-2 border-dashed border-white/10 rounded-[2rem] my-4 mx-8">
                                                Image URL needed
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            case 'link': {
                                const linkData = (() => { try { return JSON.parse(block.content); } catch { return { text: block.content, url: block.content }; } })();
                                return (
                                    <a key={block.id} href={linkData.url || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-4 px-8 py-5 my-6 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[2rem] text-blue-300 font-bold hover:border-blue-500/40 hover:from-blue-500/10 transition-all shadow-xl group">
                                        <LinkIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">External Resource</span>
                                            <span className="truncate max-w-sm">{linkData.text || linkData.url || 'Setup link'}</span>
                                        </div>
                                    </a>
                                );
                            }
                            case 'prev_link': {
                                const linkData = (() => { try { return JSON.parse(block.content); } catch { return { text: block.content, url: '#' }; } })();
                                return (
                                    <a key={block.id} href={linkData.url || '#'} className="flex items-center gap-6 px-10 py-8 my-12 bg-purple-500/5 border border-purple-500/10 rounded-[3rem] text-purple-300 font-bold hover:bg-purple-500/10 transition-all shadow-2xl group border-l-[8px] border-l-purple-500 ring-1 ring-white/5">
                                        <ArrowLeft className="w-8 h-8 group-hover:-translate-x-3 transition-transform text-purple-500" />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] uppercase tracking-[0.3em] text-purple-500/60 mb-1">Previous Topic</span>
                                            <span className="text-xl lg:text-2xl font-black">{linkData.text || 'Setup link'}</span>
                                        </div>
                                    </a>
                                );
                            }
                            case 'next_link': {
                                const linkData = (() => { try { return JSON.parse(block.content); } catch { return { text: block.content, url: '#' }; } })();
                                return (
                                    <a key={block.id} href={linkData.url || '#'} className="flex items-center justify-between gap-6 px-10 py-8 my-12 bg-blue-500/5 border border-blue-500/10 rounded-[3rem] text-blue-300 font-bold hover:bg-blue-500/10 transition-all shadow-2xl group border-r-[8px] border-r-blue-500 ring-1 ring-white/5">
                                        <div className="flex flex-col text-right flex-1">
                                            <span className="text-[11px] uppercase tracking-[0.3em] text-blue-500/60 mb-1">Next Topic</span>
                                            <span className="text-xl lg:text-2xl font-black">{linkData.text || 'Setup link'}</span>
                                        </div>
                                        <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform text-blue-500" />
                                    </a>
                                );
                            }
                            case 'code':
                                return (
                                    <div key={block.id} className="my-8 relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl opacity-30 group-hover:opacity-50 transition-opacity rounded-xl"></div>
                                        <pre className="relative bg-[#0f172a]/80 backdrop-blur border border-white/10 p-6 rounded-2xl overflow-x-auto text-sm shadow-2xl font-mono text-blue-300">
                                            <code>{block.content}</code>
                                        </pre>
                                    </div>
                                );
                            case 'note':
                                return (
                                    <div key={block.id} className="my-8 relative overflow-hidden bg-blue-900/20 border border-blue-500/20 px-6 py-3 rounded-2xl shadow-lg backdrop-blur">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
                                        <div className="font-bold text-blue-400 mb-2 flex items-center gap-2 uppercase tracking-wider text-xs">
                                            <FileText className="w-4 h-4" /> Feature Note
                                        </div>
                                        <div className="text-blue-100/90 leading-relaxed font-light text-[17px]" dangerouslySetInnerHTML={{ __html: content }} />
                                    </div>
                                );
                            case 'warning':
                                return (
                                    <div key={block.id} className="my-8 relative overflow-hidden bg-orange-900/20 border border-orange-500/20 p-6 rounded-2xl shadow-lg backdrop-blur">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-red-600"></div>
                                        <div className="font-bold text-orange-400 mb-2 flex items-center gap-2 uppercase tracking-wider text-xs">
                                            ⚠️ Caution
                                        </div>
                                        <div className="text-orange-100/90 leading-relaxed font-light text-[17px]" dangerouslySetInnerHTML={{ __html: content }} />
                                    </div>
                                );
                            case 'example':
                                return (
                                    <div key={block.id} className="my-8 bg-[rgba(30,41,59,0.5)] border border-white/5 p-8 rounded-3xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur relative">
                                        <div className="absolute top-0 right-10 transform -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] px-4 py-1 rounded-full font-bold tracking-widest uppercase shadow-lg border border-white/20">
                                            Code Example
                                        </div>
                                        <div className="text-slate-300 font-mono text-sm leading-8 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />
                                    </div>
                                );
                            case 'divider':
                                return <div key={block.id} className="my-14 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full" />;
                            default:
                                return <div key={block.id} className="my-5 leading-relaxed font-light text-slate-300 text-lg whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />;
                        }
                    })}
                </div>
            </div>

            <div
                className={`flex-shrink-0 border-l border-white/10 bg-[rgba(15,23,42,0.4)] backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar relative transition-all duration-300 hidden lg:block
                    ${tocOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 p-0 overflow-hidden'}`}
            >
                <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />
                <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
                    On This Page
                </h3>

                {toc.length === 0 ? (
                    <p className="text-sm text-slate-500/80 italic font-light">No headings provided.</p>
                ) : (
                    <ul className="space-y-4 mb-14 relative before:absolute before:inset-y-0 before:left-[3px] before:w-px before:bg-white/5">
                        {toc.map(b => (
                            <li key={b.id} className="relative" style={{ paddingLeft: b.type === 'h1' ? '0px' : b.type === 'h2' ? '16px' : b.type === 'h3' ? '28px' : '36px' }}>
                                <div className={`absolute top-2.5 left-[-2px] w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] ${b.type === 'h1' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                <a
                                    href={`#${b.id}`}
                                    className={`text-sm transition-all hover:text-blue-400 block break-words ${b.type === 'h1' ? 'text-slate-100 font-extrabold text-[15px]' : b.type === 'h2' ? 'text-slate-300 font-bold' : 'text-slate-400 font-medium opacity-80'}`}
                                >
                                    {b.content}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}

                <h3 className="font-bold text-white mb-5 uppercase tracking-widest text-xs flex items-center gap-3 mt-10">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                    Data Options
                </h3>
                <div className="flex flex-col gap-3">
                    <button onClick={() => exportDocument('html')} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/40 hover:bg-blue-500/10 transition-all shadow-lg group">
                        <FileDown className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        Export HTML
                    </button>
                    <button onClick={() => exportDocument('markdown')} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/40 hover:bg-purple-500/10 transition-all shadow-lg group">
                        <Download className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        Markdown format
                    </button>

                    <div className="h-px bg-white/5 my-2" />

                    <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all shadow-lg group">
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Delete Page
                    </button>
                </div>
            </div>
        </div>
    );
}
