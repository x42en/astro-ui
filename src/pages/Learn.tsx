import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BookOpen,
  Camera,
  Crosshair,
  Layers,
  LifeBuoy,
  Moon,
  MoonStar,
  RefreshCcw,
  Sparkles,
  Sun,
  Telescope,
  Wand2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { SectionHeading } from '../components/landing/SectionHeading';

const TOC = [
  { href: '#frames', labelKey: 'learn.toc.frameTypes' },
  { href: '#calibration-reuse', labelKey: 'learn.toc.reuseCheatSheet' },
  { href: '#pipeline', labelKey: 'learn.toc.pipeline' },
  { href: '#tips', labelKey: 'learn.toc.beginnerTips' },
];

export function Learn() {
  return (
    <div className="bg-space-bg text-text-primary">
      <Hero />
      <Primer />
      <Frames />
      <ReuseCheatSheet />
      <Pipeline />
      <Tips />
      <FinalCta />
    </div>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative border-b border-space-border overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative max-w-4xl mx-auto px-6 py-20 sm:py-24 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-space-border bg-space-elevated/40 text-[11px] uppercase tracking-[0.18em] font-semibold text-accent">
          <BookOpen size={12} />
          {t('learn.hero.badge')}
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
          {t('learn.hero.title').split(',')[0]},{t('learn.hero.title').split(',')[1]}
        </h1>
        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          {t('learn.hero.description')}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {TOC.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-xs px-3 py-1.5 rounded-md border border-space-border bg-space-elevated/40 text-text-secondary hover:text-text-primary hover:border-white/15 transition-colors"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

function Primer() {
  const { t } = useTranslation();
  return (
    <section className="border-b border-space-border bg-space-bg">
      <div className="max-w-4xl mx-auto px-6 py-14 sm:py-16">
        <SectionHeading
          kicker={t('learn.primer.kicker')}
          title={t('learn.primer.title')}
          subtitle={t('learn.primer.description')}
        />
      </div>
    </section>
  );
}

function Frames() {
  const { t } = useTranslation();
  const frameTypes = [
    {
      icon: Telescope,
      name: t('learn.frames.light.name'),
      purpose: t('learn.frames.light.purpose'),
      count: t('learn.frames.light.count'),
      exposure: t('learn.frames.light.exposure'),
      reusable: 'single-use' as const,
      notes: t('learn.frames.light.notes'),
    },
    {
      icon: Moon,
      name: t('learn.frames.dark.name'),
      purpose: t('learn.frames.dark.purpose'),
      count: t('learn.frames.dark.count'),
      exposure: t('learn.frames.dark.exposure'),
      reusable: 'reusable' as const,
      notes: t('learn.frames.dark.notes'),
    },
    {
      icon: Sun,
      name: t('learn.frames.flat.name'),
      purpose: t('learn.frames.flat.purpose'),
      count: t('learn.frames.flat.count'),
      exposure: t('learn.frames.flat.exposure'),
      reusable: 'single-use' as const,
      notes: t('learn.frames.flat.notes'),
    },
    {
      icon: MoonStar,
      name: t('learn.frames.darkFlat.name'),
      purpose: t('learn.frames.darkFlat.purpose'),
      count: t('learn.frames.darkFlat.count'),
      exposure: t('learn.frames.darkFlat.exposure'),
      reusable: 'reusable' as const,
      notes: t('learn.frames.darkFlat.notes'),
    },
    {
      icon: Zap,
      name: t('learn.frames.bias.name'),
      purpose: t('learn.frames.bias.purpose'),
      count: t('learn.frames.bias.count'),
      exposure: t('learn.frames.bias.exposure'),
      reusable: 'long-term' as const,
      notes: t('learn.frames.bias.notes'),
    },
  ];

  return (
    <section id="frames" className="border-b border-space-border bg-space-bg scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 space-y-12">
        <SectionHeading
          kicker={t('learn.frames.kicker')}
          title={t('learn.frames.title')}
          subtitle={t('learn.frames.description')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {frameTypes.map((frame) => (
            <FrameCard key={frame.name} frame={frame} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FrameCard({ frame }: { frame: {
  icon: LucideIcon;
  name: string;
  purpose: string;
  count: string;
  exposure: string;
  reusable: 'single-use' | 'reusable' | 'long-term';
  notes: string;
}}) {
  const { t } = useTranslation();
  const Icon = frame.icon;
  const reusableLabel = frame.reusable === 'single-use'
    ? t('learn.frames.singleUse')
    : frame.reusable === 'long-term'
      ? t('learn.frames.longTermReusable')
      : t('learn.frames.reusable');
  const badgeStyle =
    frame.reusable === 'single-use'
      ? 'bg-error/10 border-error/25 text-error'
      : frame.reusable === 'long-term'
        ? 'bg-success/10 border-success/25 text-success'
        : 'bg-accent/10 border-accent/25 text-accent';

  return (
    <article className="group rounded-xl border border-space-border bg-space-elevated/40 p-5 hover:border-white/15 hover:bg-space-elevated/70 transition-colors flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Icon size={17} />
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border ${badgeStyle}`}
        >
          {reusableLabel}
        </span>
      </header>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-text-primary">{frame.name}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{frame.purpose}</p>
      </div>
      <dl className="space-y-2 text-xs border-t border-space-border pt-3">
        <div className="flex items-baseline gap-2">
          <dt className="text-text-muted uppercase tracking-wider w-20 flex-shrink-0">{t('learn.frames.count')}</dt>
          <dd className="text-text-secondary">{frame.count}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-text-muted uppercase tracking-wider w-20 flex-shrink-0">{t('learn.frames.exposure')}</dt>
          <dd className="text-text-secondary">{frame.exposure}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-text-muted uppercase tracking-wider w-20 flex-shrink-0">{t('learn.frames.notes')}</dt>
          <dd className="text-text-secondary">{frame.notes}</dd>
        </div>
      </dl>
    </article>
  );
}

function ReuseCheatSheet() {
  const { t } = useTranslation();
  const reuseMatrix = [
    {
      library: t('learn.reuse.lights.library'),
      invalidatedBy: t('learn.reuse.lights.invalidatedBy'),
      shelfLife: t('learn.reuse.lights.shelfLife'),
    },
    {
      library: t('learn.reuse.darks.library'),
      invalidatedBy: t('learn.reuse.darks.invalidatedBy'),
      shelfLife: t('learn.reuse.darks.shelfLife'),
    },
    {
      library: t('learn.reuse.flats.library'),
      invalidatedBy: t('learn.reuse.flats.invalidatedBy'),
      shelfLife: t('learn.reuse.flats.shelfLife'),
    },
    {
      library: t('learn.reuse.darkFlats.library'),
      invalidatedBy: t('learn.reuse.darkFlats.invalidatedBy'),
      shelfLife: t('learn.reuse.darkFlats.shelfLife'),
    },
    {
      library: t('learn.reuse.bias.library'),
      invalidatedBy: t('learn.reuse.bias.invalidatedBy'),
      shelfLife: t('learn.reuse.bias.shelfLife'),
    },
  ];

  return (
    <section
      id="calibration-reuse"
      className="border-b border-space-border bg-gradient-to-b from-space-bg to-space-elevated/20 scroll-mt-16"
    >
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-24 space-y-10">
        <SectionHeading
          kicker={t('learn.reuse.kicker')}
          title={t('learn.reuse.title')}
          subtitle={t('learn.reuse.description')}
        />
        <div className="overflow-x-auto rounded-xl border border-space-border bg-space-elevated/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted text-xs uppercase tracking-wider border-b border-space-border">
                <th className="px-4 py-3 font-semibold">{t('learn.reuse.library')}</th>
                <th className="px-4 py-3 font-semibold">{t('learn.reuse.invalidatedBy')}</th>
                <th className="px-4 py-3 font-semibold">{t('learn.reuse.shelfLife')}</th>
              </tr>
            </thead>
            <tbody>
              {reuseMatrix.map((row, idx) => (
                <tr
                  key={row.library}
                  className={
                    idx === reuseMatrix.length - 1
                      ? ''
                      : 'border-b border-space-border/60'
                  }
                >
                  <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                    {row.library}
                  </td>
                  <td className="px-4 py-3 text-text-secondary leading-relaxed">
                    {row.invalidatedBy}
                  </td>
                  <td className="px-4 py-3 text-text-secondary leading-relaxed">
                    {row.shelfLife}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Pipeline() {
  const { t } = useTranslation();
  const pipelineSteps = [
    {
      machine: 'raw_conversion',
      title: t('learn.pipeline.steps.rawConversion.title'),
      engine: t('learn.pipeline.steps.rawConversion.engine'),
      description: t('learn.pipeline.steps.rawConversion.description'),
    },
    {
      machine: 'preprocessing',
      title: t('learn.pipeline.steps.preprocessing.title'),
      engine: t('learn.pipeline.steps.preprocessing.engine'),
      description: t('learn.pipeline.steps.preprocessing.description'),
    },
    {
      machine: 'plate_solving',
      title: t('learn.pipeline.steps.plateSolving.title'),
      engine: t('learn.pipeline.steps.plateSolving.engine'),
      description: t('learn.pipeline.steps.plateSolving.description'),
    },
    {
      machine: 'gradient_removal',
      title: t('learn.pipeline.steps.gradientRemoval.title'),
      engine: t('learn.pipeline.steps.gradientRemoval.engine'),
      description: t('learn.pipeline.steps.gradientRemoval.description'),
    },
    {
      machine: 'stretch_color',
      title: t('learn.pipeline.steps.stretchColor.title'),
      engine: t('learn.pipeline.steps.stretchColor.engine'),
      description: t('learn.pipeline.steps.stretchColor.description'),
    },
    {
      machine: 'denoise',
      title: t('learn.pipeline.steps.denoise.title'),
      engine: t('learn.pipeline.steps.denoise.engine'),
      description: t('learn.pipeline.steps.denoise.description'),
    },
    {
      machine: 'sharpen',
      title: t('learn.pipeline.steps.sharpen.title'),
      engine: t('learn.pipeline.steps.sharpen.engine'),
      description: t('learn.pipeline.steps.sharpen.description'),
    },
    {
      machine: 'super_resolution',
      title: t('learn.pipeline.steps.superResolution.title'),
      engine: t('learn.pipeline.steps.superResolution.engine'),
      description: t('learn.pipeline.steps.superResolution.description'),
    },
    {
      machine: 'star_separation',
      title: t('learn.pipeline.steps.starSeparation.title'),
      engine: t('learn.pipeline.steps.starSeparation.engine'),
      description: t('learn.pipeline.steps.starSeparation.description'),
    },
    {
      machine: 'satellite_removal',
      title: t('learn.pipeline.steps.satelliteRemoval.title'),
      engine: t('learn.pipeline.steps.satelliteRemoval.engine'),
      description: t('learn.pipeline.steps.satelliteRemoval.description'),
    },
    {
      machine: 'export',
      title: t('learn.pipeline.steps.export.title'),
      engine: t('learn.pipeline.steps.export.engine'),
      description: t('learn.pipeline.steps.export.description'),
    },
  ];

  return (
    <section id="pipeline" className="border-b border-space-border bg-space-bg scroll-mt-16">
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-24 space-y-12">
        <SectionHeading
          kicker={t('learn.pipeline.kicker')}
          title={t('learn.pipeline.title')}
          subtitle={t('learn.pipeline.description')}
        />
        <ol className="space-y-3">
          {pipelineSteps.map((step, idx) => (
            <li
              key={step.machine}
              className="rounded-xl border border-space-border bg-space-elevated/40 hover:bg-space-elevated/60 transition-colors p-5 flex gap-4"
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-semibold flex items-center justify-center">
                {idx + 1}
              </span>
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent">
                    {step.engine}
                  </span>
                  <code className="text-[11px] text-text-muted font-mono">
                    {step.machine}
                  </code>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Tips() {
  const { t } = useTranslation();
  const tips = [
    {
      icon: Crosshair,
      title: t('learn.tips.focus.title'),
      body: t('learn.tips.focus.body'),
    },
    {
      icon: RefreshCcw,
      title: t('learn.tips.dither.title'),
      body: t('learn.tips.dither.body'),
    },
    {
      icon: Layers,
      title: t('learn.tips.captureOrder.title'),
      body: t('learn.tips.captureOrder.body'),
    },
    {
      icon: Camera,
      title: t('learn.tips.matchCalibration.title'),
      body: t('learn.tips.matchCalibration.body'),
    },
    {
      icon: Sparkles,
      title: t('learn.tips.brightTargets.title'),
      body: t('learn.tips.brightTargets.body'),
    },
    {
      icon: Wand2,
      title: t('learn.tips.profiles.title'),
      body: t('learn.tips.profiles.body'),
    },
  ];

  return (
    <section id="tips" className="border-b border-space-border bg-space-bg scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 space-y-12">
        <SectionHeading
          kicker={t('learn.tips.kicker')}
          title={t('learn.tips.title')}
          subtitle={t('learn.tips.description')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <article
                key={tip.title}
                className="rounded-xl border border-space-border bg-space-elevated/40 p-5 hover:border-white/15 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                  <Icon size={17} />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1.5">
                  {tip.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {tip.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useTranslation();
  return (
    <section className="bg-space-bg">
      <div className="max-w-3xl mx-auto px-6 py-20 sm:py-24 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {t('learn.cta.title')}
        </h2>
        <p className="text-text-secondary">
          {t('learn.cta.description')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            {t('learn.cta.getStarted')}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white hover:bg-white/[0.08] hover:border-white/25 transition-colors"
          >
            {t('learn.cta.browseGallery')}
          </Link>
        </div>
        <p className="text-xs text-text-muted pt-4 inline-flex items-center gap-1.5 justify-center">
          <LifeBuoy size={12} />
          {t('learn.cta.help')}
        </p>
      </div>
    </section>
  );
}
