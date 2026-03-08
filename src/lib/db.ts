import fs from 'fs/promises';
import path from 'path';
import { Document } from './types';

const DB_PATH = path.join(process.cwd(), 'data.json');

async function initializeDb() {
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.writeFile(DB_PATH, JSON.stringify([]));
    }
}

export async function getDocuments(): Promise<Document[]> {
    await initializeDb();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

export async function getDocumentById(id: string): Promise<Document | null> {
    const docs = await getDocuments();
    return docs.find(doc => doc.id === id) || null;
}

export async function saveDocument(doc: Document): Promise<Document> {
    const docs = await getDocuments();
    const existingIndex = docs.findIndex(d => d.id === doc.id);

    const ts = Date.now();
    if (existingIndex >= 0) {
        docs[existingIndex] = { ...doc, updatedAt: ts };
    } else {
        docs.push({ ...doc, createdAt: ts, updatedAt: ts });
    }

    await fs.writeFile(DB_PATH, JSON.stringify(docs, null, 2));
    return doc;
}

export async function deleteDocument(id: string): Promise<boolean> {
    const docs = await getDocuments();
    const initialLength = docs.length;
    const filteredDocs = docs.filter(doc => doc.id !== id);

    if (filteredDocs.length < initialLength) {
        await fs.writeFile(DB_PATH, JSON.stringify(filteredDocs, null, 2));
        return true;
    }
    return false;
}

export async function deleteAllDocuments(): Promise<boolean> {
    await fs.writeFile(DB_PATH, JSON.stringify([], null, 2));
    return true;
}

export async function deleteDocsInSpace(space: string): Promise<boolean> {
    const docs = await getDocuments();
    const filteredDocs = docs.filter(doc => (doc.space || 'Uncategorized') !== space);
    await fs.writeFile(DB_PATH, JSON.stringify(filteredDocs, null, 2));
    return true;
}
