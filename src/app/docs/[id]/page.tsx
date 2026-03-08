import { fetchDocument, fetchDocuments } from '@/app/actions';
import DocumentEditor from '@/components/DocumentEditor';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: Props) {
    const { id } = await params;
    const doc = await fetchDocument(id);
    const allDocs = await fetchDocuments();

    if (!doc) {
        notFound();
    }

    return <DocumentEditor initialDoc={doc} allDocs={allDocs} />;
}
