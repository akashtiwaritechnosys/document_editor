'use client';

import { BlockType } from '@/lib/types';
import {
    Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
    Type, Code, FileText, AlertTriangle, PlaySquare, Minus,
    List, ListOrdered, TableProperties, Image, Link as LinkIcon,
    ArrowLeft, ArrowRight
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    position: { x: number; y: number } | null;
    filter: string;
    onSelect: (type: BlockType) => void;
    closeMenu: () => void;
}

const COMMANDS: { type: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: 'paragraph', label: 'Text', icon: <Type size={18} />, desc: 'Standard paragraph' },
    { type: 'h1', label: 'Heading 1', icon: <Heading1 size={18} />, desc: 'Large section heading' },
    { type: 'h2', label: 'Heading 2', icon: <Heading2 size={18} />, desc: 'Medium section heading' },
    { type: 'h3', label: 'Heading 3', icon: <Heading3 size={18} />, desc: 'Small section heading' },
    { type: 'h4', label: 'Heading 4', icon: <Heading4 size={18} />, desc: 'Sub-section heading' },
    { type: 'h5', label: 'Heading 5', icon: <Heading5 size={18} />, desc: 'Minor heading' },
    { type: 'h6', label: 'Heading 6', icon: <Heading6 size={18} />, desc: 'Tiny heading' },
    { type: 'bullet', label: 'Bullet List', icon: <List size={18} />, desc: 'Unordered list' },
    { type: 'number', label: 'Numbered List', icon: <ListOrdered size={18} />, desc: 'Ordered list' },
    { type: 'code', label: 'Code Block', icon: <Code size={18} />, desc: 'Syntax highlighted code' },
    { type: 'table', label: 'Table', icon: <TableProperties size={18} />, desc: 'Data table' },
    { type: 'image', label: 'Image Upload', icon: <Image size={18} />, desc: 'Insert an image' },
    { type: 'note', label: 'Info Note', icon: <FileText size={18} className="text-blue-400" />, desc: 'Highlight information' },
    { type: 'warning', label: 'Warning', icon: <AlertTriangle size={18} className="text-orange-400" />, desc: 'Important warnings' },
    { type: 'example', label: 'Example', icon: <PlaySquare size={18} className="text-purple-400" />, desc: 'Code examples' },
    { type: 'link', label: 'Link', icon: <LinkIcon size={18} />, desc: 'Reference link' },
    { type: 'prev_link', label: 'Previous Link', icon: <ArrowLeft size={18} />, desc: 'Navigation backward' },
    { type: 'next_link', label: 'Next Link', icon: <ArrowRight size={18} />, desc: 'Navigation forward' },
    { type: 'divider', label: 'Divider', icon: <Minus size={18} />, desc: 'Visual separator' },
];

export default function SlashCommandMenu({ position, filter, onSelect, closeMenu }: Props) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredCommands = COMMANDS.filter(cmd =>
        cmd.label.toLowerCase().includes(filter.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [filter]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                closeMenu();
            }
        };
        if (position) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [position, closeMenu]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!position) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex].type);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [position, filteredCommands, selectedIndex, onSelect]);

    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (!position || !menuRef.current) return;

        const menuHeight = Math.max(menuRef.current.offsetHeight, 280); // Fallback to 280 for flip logic
        const windowHeight = window.innerHeight;

        let top = position.y;
        if (top + menuHeight > windowHeight) {
            top = position.y - menuHeight - 10;
        }

        setMenuStyle({
            top: Math.max(10, top),
            left: Math.min(position.x, window.innerWidth - 340)
        });
    }, [position, filter]);

    if (!position) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-80 bg-[#1e293b] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden border-t-blue-500/30"
            style={menuStyle}
        >
            <div className="px-4 py-2 border-b border-white/10 bg-white/5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Commands</span>
            </div>
            <ul className="max-h-[160px] md:max-h-72 overflow-y-auto p-2 custom-scrollbar scrollbar-visible">
                {filteredCommands.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-slate-500 font-light">No commands found</li>
                ) : (
                    filteredCommands.map((cmd, index) => (
                        <li key={cmd.type}>
                            <button
                                className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-xl transition-all ${index === selectedIndex ? 'bg-blue-600 text-white shadow-xl scale-[1.02] z-10' : 'text-slate-300 hover:bg-white/5 border border-transparent'
                                    }`}
                                onClick={() => onSelect(cmd.type)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-white/20' : 'bg-slate-800'}`}>
                                    {cmd.icon}
                                </div>
                                <div>
                                    <div className="font-bold text-[14px]">{cmd.label}</div>
                                    <div className={`text-[11px] ${index === selectedIndex ? 'text-blue-100' : 'text-slate-500'} font-light`}>{cmd.desc}</div>
                                </div>
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
