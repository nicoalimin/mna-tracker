'use client';

import { CompanyWithFilters, PipelineStage } from '@/types';
import { updateCompanyStage, addFilter } from '../actions';
import { useState } from 'react';
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CompanyCardProps {
  company: CompanyWithFilters;
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(val);
};

export default function CompanyCard({ company }: CompanyCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFilterInput, setShowFilterInput] = useState(false);
  const [newFilter, setNewFilter] = useState('');

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value as PipelineStage;
    setIsUpdating(true);
    try {
      await updateCompanyStage(company.id, newStage);
    } catch (error) {
      console.error('Failed to update stage', error);
      alert('Failed to move company');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilter.trim()) return;
    try {
      await addFilter(company.id, newFilter);
      setNewFilter('');
      setShowFilterInput(false);
    } catch (error) {
      console.error('Failed to add filter', error);
    }
  };

  return (
    <div className="group relative rounded-xl border border-white/5 bg-zinc-900/80 p-4 shadow-lg transition-all hover:border-white/10 hover:bg-zinc-900 hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-100">{company.company_name}</h3>
            {company.trend === 'Up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
            {company.trend === 'Down' && <TrendingDown className="h-4 w-4 text-rose-500" />}
          </div>
          <p className="text-xs text-zinc-400">{company.sector}</p>
        </div>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400 border border-white/5">
          {company.source}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">Revenue Y3</p>
          <p className="font-medium text-zinc-200">{formatCurrency(company.revenue_y3)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">EBITDA Y3</p>
          <p className="font-medium text-zinc-200">{formatCurrency(company.ebitda_y3)}</p>
        </div>
        <div className="space-y-1 col-span-2">
          <p className="text-xs text-zinc-500">Valuation</p>
          <p className="font-medium text-emerald-400">{formatCurrency(company.valuation)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-xs text-zinc-500">Stage</label>
        <select
          value={company.status}
          onChange={handleStageChange}
          disabled={isUpdating}
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-colors cursor-pointer"
        >
          {['L0', 'L1', 'L2', 'L3', 'L4', 'L5'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 border-t border-white/5 pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-zinc-500 font-medium">Filters</p>
          <button
            onClick={() => setShowFilterInput(!showFilterInput)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {showFilterInput && (
          <form onSubmit={handleAddFilter} className="mb-2 flex gap-2">
            <input
              type="text"
              value={newFilter}
              onChange={(e) => setNewFilter(e.target.value)}
              placeholder="New filter..."
              className="w-full rounded bg-zinc-950 border border-zinc-800 px-2 py-1 text-xs focus:outline-none focus:border-zinc-700"
              autoFocus
            />
          </form>
        )}

        <div className="flex flex-wrap gap-1.5">
          {company.filters?.map((f) => (
            <span
              key={f.id}
              className="inline-flex max-w-full items-center truncate rounded bg-zinc-800/50 border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 group-hover:bg-zinc-800 group-hover:border-zinc-700 transition-colors"
              title={f.content}
            >
              {f.content}
            </span>
          ))}
          {(!company.filters || company.filters.length === 0) && !showFilterInput && (
            <span className="text-[10px] text-zinc-600 italic">No filters</span>
          )}
        </div>
      </div>
    </div>
  );
}
