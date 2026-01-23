import { getCompanies } from './actions';
import PipelineBoard from './components/PipelineBoard';
import AddCompanyButton from './components/AddCompanyButton';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const companies = await getCompanies();

  return (
    <main className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b border-white/5 bg-zinc-950 px-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"></div>
          <h1 className="text-lg font-bold tracking-tight text-white">DealFlow</h1>
        </div>
        <AddCompanyButton />
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <PipelineBoard companies={companies} />
      </div>
    </main>
  );
}
