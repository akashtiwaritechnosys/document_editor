import { fetchDocuments } from '@/app/actions';
import DocumentEditor from '@/components/DocumentEditor';

export default async function NewDocumentPage() {
    const allDocs = await fetchDocuments();
    return <DocumentEditor allDocs={allDocs} />;
}
