import { fetchDocuments } from '@/app/actions';
import SidebarClient from './SidebarClient';

export default async function Sidebar() {
    const docs = await fetchDocuments();
    return <SidebarClient docs={docs} />;
}
