'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface FinancialChartsProps {
  revenue_year1: number | null;
  revenue_year2: number | null;
  revenue_year3: number | null;
  ebitda_year1: number | null;
  ebitda_year2: number | null;
  ebitda_year3: number | null;
}

const formatCurrency = (value: number | null) => {
  if (value === null || value === 0) return '-';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

export function FinancialCharts({
  revenue_year1,
  revenue_year2,
  revenue_year3,
  ebitda_year1,
  ebitda_year2,
  ebitda_year3,
}: FinancialChartsProps) {
  const revenueData = [
    { year: '2022', value: revenue_year1 || 0 },
    { year: '2023', value: revenue_year2 || 0 },
    { year: '2024', value: revenue_year3 || 0 },
  ];

  const ebitdaData = [
    { year: '2022', value: ebitda_year1 || 0 },
    { year: '2023', value: ebitda_year2 || 0 },
    { year: '2024', value: ebitda_year3 || 0 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Revenue (3Y)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ChartContainer
              config={{
                value: {
                  label: "Revenue",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-full w-full"
            >
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  className="text-xs"
                  width={60}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
            {revenueData.map((item) => (
              <div key={item.year} className="text-center">
                <p className="text-xs text-muted-foreground">{item.year}</p>
                <p className="font-semibold text-sm">{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* EBITDA Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" />
            EBITDA (3Y)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ChartContainer
              config={{
                value: {
                  label: "EBITDA",
                  color: "hsl(var(--success))",
                },
              }}
              className="h-full w-full"
            >
              <BarChart data={ebitdaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  className="text-xs"
                  width={60}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--success))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
            {ebitdaData.map((item) => (
              <div key={item.year} className="text-center">
                <p className="text-xs text-muted-foreground">{item.year}</p>
                <p className="font-semibold text-sm">{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
