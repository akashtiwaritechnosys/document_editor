export type BlockType =
    | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'paragraph' | 'code' | 'note' | 'warning' | 'example'
    | 'table' | 'image' | 'bullet' | 'number' | 'divider'
    | 'link' | 'prev_link' | 'next_link';

export interface Block {
    id: string;
    type: BlockType;
    content: string;
}

export interface Document {
    id: string;
    title: string;
    space: string;
    blocks: Block[];
    createdAt: number;
    updatedAt: number;
}
