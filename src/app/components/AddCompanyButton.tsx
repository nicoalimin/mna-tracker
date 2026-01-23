'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { createCompany } from '../actions';
import { PipelineStage } from '@/types';

export default function AddCompanyButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    sector: '',
    source: '',
    status: 'L0' as PipelineStage,
    revenue_y1: 0,
    revenue_y2: 0,
    revenue_y3: 0,
    trend: 'Flat',
    ebitda_y1: 0,
    ebitda_y2: 0,
    ebitda_y3: 0,
    valuation: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createCompany(formData);
      setIsOpen(false);
      setFormData({ // Reset form
        company_name: '',
        sector: '',
        source: '',
        status: 'L0',
        revenue_y1: 0,
        revenue_y2: 0,
        revenue_y3: 0,
        trend: 'Flat',
        ebitda_y1: 0,
        ebitda_y2: 0,
        ebitda_y3: 0,
        valuation: 0,
      });
    } catch (error) {
      console.error(error);
      alert('Failed to create company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'company_name' || name === 'sector' || name === 'source' || name === 'status' || name === 'trend'
        ? value
        : Number(value),
    }));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
      >
        <Plus className="h-4 w-4" />
        Add Company
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">Add New Company</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Company Name</label>
                  <input
                    required
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Sector</label>
                  <input
                    required
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
                    placeholder="SaaS, Fintech..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Source</label>
                  <input
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
                    placeholder="Inbound, LinkedIn..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Valuation</label>
                  <input
                    type="number"
                    name="valuation"
                    value={formData.valuation}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Rev Y3</label>
                  <input
                    type="number"
                    name="revenue_y3"
                    value={formData.revenue_y3}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">EBITDA Y3</label>
                  <input
                    type="number"
                    name="ebitda_y3"
                    value={formData.ebitda_y3}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Trend</label>
                  <select
                    name="trend"
                    value={formData.trend}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
                  >
                    <option value="Up">Up</option>
                    <option value="Flat">Flat</option>
                    <option value="Down">Down</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg bg-zinc-100 px-6 py-2 text-sm font-semibold text-zinc-900 hover:bg-white disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
