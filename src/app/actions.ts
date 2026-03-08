'use server'

import { getDocuments, getDocumentById, saveDocument, deleteDocument, deleteAllDocuments, deleteDocsInSpace } from '@/lib/db';
import { Document } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function fetchDocuments() {
    return await getDocuments();
}

export async function fetchDocument(id: string) {
    return await getDocumentById(id);
}

export async function createOrUpdateDocument(doc: Document) {
    const result = await saveDocument(doc);
    revalidatePath('/');
    revalidatePath(`/docs/${doc.id}`);
    revalidatePath(`/space/${doc.space}`);
    return result;
}

export async function removeDocument(id: string) {
    const result = await deleteDocument(id);
    revalidatePath('/');
    return result;
}

export async function clearAllDocuments() {
    const result = await deleteAllDocuments();
    revalidatePath('/');
    return result;
}

export async function removeSpace(space: string) {
    const result = await deleteDocsInSpace(space);
    revalidatePath('/');
    return result;
}
