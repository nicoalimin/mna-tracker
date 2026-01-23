'use client';

import { CompanyWithFilters, PipelineStage } from '@/types';
import CompanyCard from './CompanyCard';

interface PipelineBoardProps {
  companies: CompanyWithFilters[];
}

const STAGES: PipelineStage[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];

export default function PipelineBoard({ companies }: PipelineBoardProps) {
  const getCompaniesByStage = (stage: PipelineStage) => {
    return companies.filter((c) => c.status === stage);
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageCompanies = getCompaniesByStage(stage);

        return (
          <div key={stage} className="min-w-[320px] w-[320px] flex-shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3 border border-zinc-800/50 backdrop-blur-sm sticky top-0 z-10">
              <h2 className="text-sm font-semibold text-zinc-100">{stage}</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 border border-white/5">
                {stageCompanies.length}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {stageCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
              {stageCompanies.length === 0 && (
                <div className="h-24 rounded-lg border border-dashed border-zinc-800/50 bg-zinc-900/20 flex items-center justify-center">
                  <span className="text-xs text-zinc-600">No deals</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
