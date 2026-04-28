import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Cpu,
  Github,
  Images,
  Layers,
  Share2,
  Telescope,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '../components/branding/Logo';
import {
  LandingGalleryCarousel,
} from '../components/landing/LandingGalleryCarousel';
import { SectionHeading } from '../components/landing/SectionHeading';

interface Capability {
  icon: LucideIcon;
  title: string;
  description: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: Telescope,
    title: 'End-to-end pipeline',
    description:
      'Calibration, stacking, plate solving, gradient removal, stretching, denoising, sharpening, super-resolution and star separation in a single run.',
  },
  {
    icon: Cpu,
    title: 'Multi-GPU acceleration',
    description:
      'Headless Siril, ASTAP, GraXpert and Cosmic Clarity wired to CUDA workers — distribute jobs across multiple GPUs.',
  },
  {
    icon: Layers,
    title: 'Profile presets',
    description:
      'Quick, Standard, Quality and Advanced presets give you sensible defaults; tweak any parameter when you need control.',
  },
  {
    icon: Share2,
    title: 'Share your recipes',
    description:
      'Export profiles to JSON, import in one click, or publish them so the community can stack with your exact settings.',
  },
  {
    icon: Images,
    title: 'Public gallery',
    description:
      'Publish processed sessions, get one-click downloads, and let viewers inspect the EXIF and pipeline used to produce each image.',
  },
  {
    icon: Activity,
    title: 'Real-time progress',
    description:
      'A WebSocket feed streams every step, log line and percentage so you always know where your stack is.',
  },
];

const ROADMAP: string[] = [
  'Authentication via auth-service',
  'Planet-dedicated processing pipeline',
  'Observation time-slot suggestions per target & location',
  'AI-driven session scheduling (weather · location · target)',
  'Pipeline tools and steps exposed as MCP servers',
  'AI-driven pipeline auto-selection & auto-improve agents',
  'Observation alerts (cancel reminders, target visibility, …)',
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
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-center sm:text-left">
            Your night sky,<br />
            <span className="text-gradient-accent">processed.</span>
          </h1>
        </div>
        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed text-center">
          AstroStack ingests your raw frames and runs them through a
          GPU-accelerated pipeline — calibration, stacking, plate solving and
          AI enhancement — without leaving your machine.
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
            Get started
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
            Browse gallery
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
  return (
    <section
      id="capabilities"
      className="border-t border-space-border bg-space-bg"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 space-y-12">
        <SectionHeading
          kicker="Capabilities"
          title="Everything your stacks need, in one box."
          subtitle="A full processing pipeline plus the tooling to share, reuse and inspect every result."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((c) => (
            <CapabilityCard key={c.title} capability={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilityCard({ capability }: { capability: Capability }) {
  const Icon = capability.icon;
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
  return (
    <section
      id="community"
      className="border-t border-space-border bg-gradient-to-b from-space-bg to-space-elevated/20"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <SectionHeading
            kicker="Community profiles"
            title="Tap into community-tested recipes."
            subtitle="Sign up to browse profiles published by other astronomers, import them in one click, or share your own."
          />
          <ul className="space-y-2.5 text-sm text-text-secondary">
            <Bullet>Browse shared profiles by preset, target or author.</Bullet>
            <Bullet>Import a profile and re-run it on your own frames.</Bullet>
            <Bullet>Publish your favorite recipe with a single toggle.</Bullet>
          </ul>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Create an account
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
  // Decorative — mirrors the shape of MetadataCartouche without rendering
  // real session data.  Static labels keep the landing layout deterministic.
  const tools = ['Plate solve', 'GraXpert', 'Denoise', 'Super-res', 'PCC'];
  return (
    <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/60 p-5 max-w-md md:ml-auto">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Logo variant="glyph" size={14} className="text-accent/80" />
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/70">
            AstroStack
          </span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            · Profile preview
          </span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/10 border border-accent/25 text-[9.5px] uppercase tracking-[0.10em] text-accent font-semibold">
          Quality
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-mono text-white/85">
        <Stat label="Object" value="M31" />
        <Stat label="Frames" value="120 × 60s" />
        <Stat label="Integration" value="2h 00m" />
        <Stat label="Filter" value="L-eXtreme" />
      </dl>
      <div className="border-t border-white/[0.06] mt-4 pt-3">
        <div className="text-[9.5px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-2">
          Pipeline
        </div>
        <div className="flex flex-wrap gap-1">
          {tools.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md bg-white/[0.03] border border-white/[0.08] text-[9.5px] uppercase tracking-[0.08em] text-white/75 font-medium leading-tight"
            >
              <span className="w-1 h-1 rounded-full bg-accent/70" />
              {t}
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
  return (
    <section
      id="showcase"
      className="border-t border-space-border bg-space-bg"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 space-y-10">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <SectionHeading
            kicker="Live from the community"
            title="Recently published images."
            subtitle="A live feed of sessions astronomers have just shared. Click through to inspect their EXIF and pipeline."
          />
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
          >
            Open the full gallery
            <ArrowRight size={13} />
          </Link>
        </div>
        <LandingGalleryCarousel />
      </div>
    </section>
  );
}

function Roadmap() {
  return (
    <section
      id="roadmap"
      className="border-t border-space-border bg-gradient-to-b from-space-bg to-space-elevated/20"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 space-y-10">
        <SectionHeading
          kicker="Roadmap"
          title="What we're building next."
          subtitle="A peek at the upcoming features. Priorities can shift — feedback welcome."
        />
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROADMAP.map((item, idx) => (
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
  return (
    <section
      id="join"
      className="border-t border-space-border bg-space-bg"
    >
      <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Ready to publish your first night?
        </h2>
        <p className="text-text-secondary">
          Free during preview. No card, no email verification — just sign in and
          start stacking.
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
            Create an account
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
            Learn the basics
          </Link>
          <a
            href="https://astrobackyard.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            Hero photo: AstroBackyard
          </a>
          <a
            href="https://github.com/x42en/AstroStack"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-text-secondary transition-colors"
          >
            <Github size={13} /> Backend
          </a>
          <a
            href="https://github.com/x42en/astro-stack-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-text-secondary transition-colors"
          >
            <Github size={13} /> Frontend
          </a>
        </div>
      </div>
    </footer>
  );
}
