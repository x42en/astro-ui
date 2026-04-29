import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { TopSession } from '../../types';

interface TopSessionsBarProps {
  /** Top sessions ordered by download count, descending. */
  data: TopSession[];
}

/**
 * Horizontal bar chart showing the most downloaded gallery sessions.
 *
 * Session names are truncated by the chart when the axis runs out of space.
 */
export function TopSessionsBar({ data }: TopSessionsBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-text-muted text-sm">
        No gallery sessions found
      </div>
    );
  }

  // Recharts horizontal bar: swap axes so sessions appear on the Y axis
  // and download counts on the X axis.
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 32 + 24)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 24, bottom: 0, left: 8 }}
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 20)}…` : v)}
        />
        <Tooltip
          contentStyle={{
            background: 'rgb(var(--color-space-elevated))',
            border: '1px solid rgb(var(--color-space-border))',
            borderRadius: '6px',
            color: 'rgb(var(--color-text-primary))',
            fontSize: '12px',
          }}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          formatter={(value: number) => [value.toLocaleString(), 'Downloads']}
        />
        <Bar dataKey="download_count" radius={[0, 4, 4, 0]}>
          {data.map((_entry, index) => (
            <Cell
              key={index}
              fill={index === 0 ? 'rgb(var(--color-primary))' : 'rgb(var(--color-accent))'}
              fillOpacity={1 - index * 0.07}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
