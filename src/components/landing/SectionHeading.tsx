interface SectionHeadingProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

/** Reusable two-line heading used across the landing page sections. */
export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = 'left',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-2xl space-y-3 ${alignment}`}>
      {kicker && (
        <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-accent">
          {kicker}
        </div>
      )}
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base text-text-secondary leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
