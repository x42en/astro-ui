import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { DailyCount } from '../../types';

interface DownloadsLineChartProps {
  /** Daily download counts, ordered chronologically. */
  data: DailyCount[];
}

/**
 * Line chart showing gallery download volume over the last N days.
 *
 * Gaps (days with zero downloads) are bridged by Recharts' `connectNulls`
 * option. Axes and tooltip use the project's colour tokens.
 */
export function DownloadsLineChart({ data }: DownloadsLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        No download data in the selected period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }}
          tickFormatter={(v: string) => v.slice(5)} // MM-DD
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'rgb(var(--color-space-elevated))',
            border: '1px solid rgb(var(--color-space-border))',
            borderRadius: '6px',
            color: 'rgb(var(--color-text-primary))',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'rgb(var(--color-text-secondary))' }}
          cursor={{ stroke: 'rgb(var(--color-space-border-light))', strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="rgb(var(--color-primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'rgb(var(--color-primary))' }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
