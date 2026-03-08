import Dashboard from '@/components/Dashboard';
import { fetchDocuments } from './actions';

export default async function Home() {
  const docs = await fetchDocuments();

  return (
    <Dashboard docs={docs} />
  );
}
