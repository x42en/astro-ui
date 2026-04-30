import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FormatDonutChartProps {
  /** Number of TIFF downloads. */
  tiffCount: number;
  /** Number of FITS downloads. */
  fitsCount: number;
}

const COLORS = [
  'rgb(var(--color-primary))',
  'rgb(var(--color-accent))',
];

/**
 * Donut chart showing the TIFF vs FITS download format split.
 *
 * When there are no downloads the chart is replaced by a placeholder message.
 */
export function FormatDonutChart({ tiffCount, fitsCount }: FormatDonutChartProps) {
  const total = tiffCount + fitsCount;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        No downloads recorded yet
      </div>
    );
  }

  const data = [
    { name: 'TIFF', value: tiffCount },
    { name: 'FITS', value: fitsCount },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgb(var(--color-space-elevated))',
            border: '1px solid rgb(var(--color-space-border))',
            borderRadius: '6px',
            color: 'rgb(var(--color-text-primary))',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [
            `${value.toLocaleString()} (${Math.round((value / total) * 100)}%)`,
            name,
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', color: 'rgb(var(--color-text-secondary))' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
