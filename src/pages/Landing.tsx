import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Cpu,
  Github,
  Images,
  Layers,
  Radio,
  Share2,
  Sliders,
  Telescope,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '../components/branding/Logo';
import {
  LandingGalleryCarousel,
} from '../components/landing/LandingGalleryCarousel';
import { SectionHeading } from '../components/landing/SectionHeading';
import { useTranslation } from 'react-i18next';

const CAPABILITY_ICONS: LucideIcon[] = [
  Telescope, Radio, CalendarClock, Sliders, Cpu, Layers, Share2, Images, Activity,
];

export function Landing() {
  return (
    <div className="bg-space-bg text-text-primary">
      <Hero />
      <Capabilities />
      <Community />
      <Showcase />
      <Roadmap />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section
      id="hero"
      className="relative min-h-[88vh] flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/background.jpg)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-space-bg/70 via-space-bg/55 to-space-bg"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.10),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl px-6 py-24 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7">
          <Logo
            variant="mark"
            size={128}
            className="text-white text-4xl sm:text-5xl md:text-6xl [&>svg]:!w-auto [&>svg]:!h-[2.1em]"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-center sm:text-left"
              dangerouslySetInnerHTML={{ __html: t('landing.hero.title') }} />
        </div>
        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed text-center">
          {t('landing.hero.description')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="
              group inline-flex items-center gap-2 rounded-md bg-primary
              px-5 py-2.5 text-sm font-medium text-white
              hover:bg-primary-hover transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary/40
            "
          >
            {t('landing.hero.getStarted')}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            to="/gallery"
            className="
              inline-flex items-center gap-2 rounded-md border border-white/15
              bg-white/[0.04] backdrop-blur-md
              px-5 py-2.5 text-sm font-medium text-white
              hover:bg-white/[0.08] hover:border-white/25 transition-colors
            "
          >
            <Images size={14} />
            {t('landing.hero.browseGallery')}
          </Link>
        </div>
      </div>

      <a
        href="https://astrobackyard.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-4 z-10 text-[10px] tracking-wider text-white/40 hover:text-white/70 transition-colors"
      >
        Photo by AstroBackyard
      </a>
    </section>
  );
}

function Capabilities() {
  const { t } = useTranslation();
  const capabilityList = t('landing.capabilityList', { returnObjects: true }) as Array<{ title: string; description: string }>;

  return (
    <section
      id="capabilities"
      className="border-t border-space-border bg-space-bg"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 space-y-12">
        <SectionHeading
          kicker={t('landing.capabilities.kicker')}
          title={t('landing.capabilities.title')}
          subtitle={t('landing.capabilities.subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilityList.map((c, idx) => (
            <CapabilityCard key={c.title} capability={c} icon={CAPABILITY_ICONS[idx]} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilityCard({ capability, icon: Icon }: { capability: { title: string; description: string }; icon: LucideIcon }) {
  return (
    <div className="group rounded-xl border border-space-border bg-space-elevated/40 p-5 hover:border-white/15 hover:bg-space-elevated/70 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/15">
        <Icon size={17} />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1.5">
        {capability.title}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        {capability.description}
      </p>
    </div>
  );
}

function Community() {
  const { t } = useTranslation();
  const bulletList = t('landing.community.list', { returnObjects: true }) as string[];

  return (
    <section
      id="community"
      className="border-t border-space-border bg-gradient-to-b from-space-bg to-space-elevated/20"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <SectionHeading
            kicker={t('landing.community.kicker')}
            title={t('landing.community.title')}
            subtitle={t('landing.community.subtitle')}
          />
          <ul className="space-y-2.5 text-sm text-text-secondary">
            {bulletList.map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            {t('landing.community.createAccount')}
            <ArrowRight size={14} />
          </Link>
        </div>
        <ProfileTeaserMock />
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent/70 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function ProfileTeaserMock() {
  const { t } = useTranslation();
  const tools = [t('landing.tools.plateSolve'), 'GraXpert', t('landing.tools.denoise'), t('landing.tools.superRes'), 'PCC'];
  return (
    <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/60 p-5 max-w-md md:ml-auto">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Logo variant="glyph" size={14} className="text-accent/80" />
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/70">
            AstroStack
          </span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            · {t('landing.tools.profilePreview')}
          </span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/10 border border-accent/25 text-[9.5px] uppercase tracking-[0.10em] text-accent font-semibold">
          {t('landing.tools.quality')}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-mono text-white/85">
        <Stat label={t('landing.tools.object')} value="M31" />
        <Stat label={t('landing.tools.frames')} value="120 × 60s" />
        <Stat label={t('landing.tools.integration')} value="2h 00m" />
        <Stat label={t('landing.tools.filter')} value="L-eXtreme" />
      </dl>
      <div className="border-t border-white/[0.06] mt-4 pt-3">
        <div className="text-[9.5px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-2">
          {t('landing.tools.pipeline')}
        </div>
        <div className="flex flex-wrap gap-1">
          {tools.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md bg-white/[0.03] border border-white/[0.08] text-[9.5px] uppercase tracking-[0.08em] text-white/75 font-medium leading-tight"
            >
              <span className="w-1 h-1 rounded-full bg-accent/70" />
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9.5px] uppercase tracking-[0.12em] text-white/40 font-semibold">
        {label}
      </dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}

function Showcase() {
  const { t } = useTranslation();
  return (
    <section
      id="showcase"
      className="border-t border-space-border bg-space-bg"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 space-y-10">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <SectionHeading
            kicker={t('landing.showcase.kicker')}
            title={t('landing.showcase.title')}
            subtitle={t('landing.showcase.subtitle')}
          />
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
          >
            {t('landing.showcase.openFullGallery')}
            <ArrowRight size={13} />
          </Link>
        </div>
        <LandingGalleryCarousel />
      </div>
    </section>
  );
}

function Roadmap() {
  const { t } = useTranslation();
  const roadmapItems = t('landing.roadmap.items', { returnObjects: true }) as string[];

  return (
    <section
      id="roadmap"
      className="border-t border-space-border bg-gradient-to-b from-space-bg to-space-elevated/20"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 space-y-10">
        <SectionHeading
          kicker={t('landing.roadmap.kicker')}
          title={t('landing.roadmap.title')}
          subtitle={t('landing.roadmap.subtitle')}
        />
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roadmapItems.map((item, idx) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-lg border border-space-border bg-space-elevated/40 px-4 py-3"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold flex items-center justify-center">
                {idx + 1}
              </span>
              <span className="text-sm text-text-secondary leading-relaxed pt-0.5">
                {item}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useTranslation();
  return (
    <section
      id="join"
      className="border-t border-space-border bg-space-bg"
    >
      <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {t('landing.finalCta.title')}
        </h2>
        <p className="text-text-secondary">
          {t('landing.finalCta.description')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="
              group inline-flex items-center gap-2 rounded-md bg-primary
              px-5 py-2.5 text-sm font-medium text-white
              hover:bg-primary-hover transition-colors
            "
          >
            {t('landing.finalCta.createAccount')}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-space-border bg-space-bg">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <Logo variant="mark" size={28} />
          <span>© {year} AstroStack — preview build</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/learn"
            className="hover:text-text-secondary transition-colors"
          >
            {t('landing.footer.learnBasics')}
          </Link>
          <a
            href="https://astrobackyard.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            {t('landing.footer.heroPhoto')}
          </a>
          <a
            href="https://github.com/x42en/AstroStack"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-text-secondary transition-colors"
          >
            <Github size={13} /> {t('landing.footer.backend')}
          </a>
          <a
            href="https://github.com/x42en/astro-stack-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-text-secondary transition-colors"
          >
            <Github size={13} /> {t('landing.footer.frontend')}
          </a>
        </div>
      </div>
    </footer>
  );
}