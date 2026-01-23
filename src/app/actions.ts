'use server';

import { supabase } from '@/lib/supabaseClient';
import { Company, CompanyWithFilters, Filter, PipelineStage } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getCompanies(): Promise<CompanyWithFilters[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*, filters(*)')
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching companies:', error);
    throw new Error('Failed to fetch companies');
  }

  return data as CompanyWithFilters[];
}

export async function getCompany(id: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return null;
  }

  return data as Company;
}

export async function createCompany(formData: Omit<Company, 'id' | 'added_at'>): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert([formData])
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    throw new Error('Failed to create company');
  }

  revalidatePath('/');
  return data as Company;
}

export async function updateCompanyStage(id: string, stage: PipelineStage): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({ status: stage })
    .eq('id', id);

  if (error) {
    console.error('Error updating company stage:', error);
    throw new Error('Failed to update company stage');
  }

  revalidatePath('/');
}

export async function addFilter(companyId: string, content: string): Promise<Filter> {
  const { data, error } = await supabase
    .from('filters')
    .insert([{ company_id: companyId, content }])
    .select()
    .single();

  if (error) {
    console.error('Error adding filter:', error);
    throw new Error('Failed to add filter');
  }

  revalidatePath('/');
  return data as Filter;
}

export async function getFilters(companyId: string): Promise<Filter[]> {
  const { data, error } = await supabase
    .from('filters')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching filters:', error);
    return [];
  }

  return data as Filter[];
}
