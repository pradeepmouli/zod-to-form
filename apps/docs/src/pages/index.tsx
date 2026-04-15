import { useState, type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import Layout from '@theme/Layout';
import styles from './index.module.css';

// ── Architecture section: tabbed snippets ────────────────────────────
// Each tab pairs the left (config) and right (code) side of a single
// integration path. The shape is deliberately uniform across tabs:
//
//   left-top:    z2f.config (or absent for runtime)
//   left-bottom: build-time config (CLI command or vite.config)
//   right-top:   user source
//   right-bottom: what the user actually sees at runtime
//
// Runtime is the simplest case — no build step — so its bottom-left
// cell is empty and its bottom-right is the rendered form preview.

const Z2F_CONFIG_SHADCN = `// z2f.config.ts
import { defineConfig } from '@zod-to-form/cli';

export default defineConfig({
  ui: 'shadcn',
  mode: 'submit',
  componentName: 'SignupForm',
});`;

const RUNTIME_APP = `// src/App.tsx
import { ZodForm } from '@zod-to-form/react';
import { signupSchema } from './schemas/signup';

export default function App() {
  return (
    <ZodForm
      schema={signupSchema}
      onSubmit={(data) => console.log(data)}
    />
  );
}`;

const CODEGEN_GENERATED = `// src/generated/SignupForm.tsx (committed to source control)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema } from '../schemas/signup';

export default function SignupForm(props) {
  const form = useForm({
    resolver: zodResolver(signupSchema),
  });
  return (
    <form onSubmit={form.handleSubmit(props.onSubmit)}>
      <input {...form.register('name')} />
      <input {...form.register('email')} type="email" />
      <select {...form.register('role')}>
        <option>admin</option>
        <option>editor</option>
        <option>viewer</option>
      </select>
      <button type="submit">Submit</button>
    </form>
  );
}`;

const PLUGIN_VITE_CONFIG = `// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import z2fVite from '@zod-to-form/vite';

export default defineConfig({
  plugins: [
    // Presence of \`generate\` opts in to JSX scanning:
    // the plugin finds <ZodForm schema={X}/> call sites
    // and compiles them away at build time.
    z2fVite({ generate: {} }),
    react(),
  ],
});`;

const PLUGIN_GENERATED = `// Compiled on the fly by @zod-to-form/vite
// (virtual module — never hits disk, cached per schema)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema } from './schemas/signup.ts';

export default function Form(props) {
  const form = useForm({
    resolver: zodResolver(signupSchema),
  });
  return (
    <form onSubmit={form.handleSubmit(props.onSubmit)}>
      {/* <input>s generated from signupSchema … */}
    </form>
  );
}`;

type PathKey = 'runtime' | 'codegen' | 'plugin';

interface IntegrationPath {
  key: PathKey;
  label: string;
  tagline: string;
  bullets: string[];
  leftTop: { title: string; language: string; source: string };
  leftBottom: { title: string; language: string; source: string } | null;
  rightTop: { title: string; language: string; source: string };
  rightBottom: { title: string; language: string; source: string } | null;
}

const PATHS: IntegrationPath[] = [
  {
    key: 'runtime',
    label: 'Runtime',
    tagline: 'Quick iteration',
    bullets: [
      'Drop in `<ZodForm>`, get a form. No build step.',
      'Schema change → form updates on the next render.',
      'Smallest mental model — perfect for admin panels and prototypes.'
    ],
    leftTop: { title: 'z2f.config.ts', language: 'tsx', source: Z2F_CONFIG_SHADCN },
    leftBottom: null,
    rightTop: { title: 'src/App.tsx', language: 'tsx', source: RUNTIME_APP },
    rightBottom: null
  },
  {
    key: 'codegen',
    label: 'Codegen',
    tagline: 'Production code you own',
    bullets: [
      'Run `zod-to-form generate`, get a static `.tsx` file you commit.',
      'Zero runtime dependency on zod-to-form in the emitted code.',
      'Hand-editable output — review diffs, apply custom tweaks, move on.'
    ],
    leftTop: { title: 'z2f.config.ts', language: 'tsx', source: Z2F_CONFIG_SHADCN },
    leftBottom: null,
    rightTop: {
      title: 'src/generated/SignupForm.tsx',
      language: 'tsx',
      source: CODEGEN_GENERATED
    },
    rightBottom: null
  },
  {
    key: 'plugin',
    label: 'Build-time (Plugin)',
    tagline: 'Best of both worlds',
    bullets: [
      'Keep writing `<ZodForm>` — the plugin scans your JSX and compiles it.',
      'HMR keeps the form in sync with the schema — no commit, no CLI step.',
      'Same generated code as the CLI path; zero runtime overhead in prod.'
    ],
    leftTop: { title: 'z2f.config.ts', language: 'tsx', source: Z2F_CONFIG_SHADCN },
    leftBottom: { title: 'vite.config.ts', language: 'tsx', source: PLUGIN_VITE_CONFIG },
    // Top = original runtime source the user wrote; bottom = what the
    // plugin emits in its place at build time. The ↓ connector between
    // the two makes the transform visible.
    rightTop: { title: 'src/App.tsx (original)', language: 'tsx', source: RUNTIME_APP },
    rightBottom: {
      title: 'Virtual module (compiled by plugin)',
      language: 'tsx',
      source: PLUGIN_GENERATED
    }
  }
];

const signupFormCode = `import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const schema = z.object({
  name:  z.string().min(2),
  email: z.string().email(),
  role:  z.enum(['admin', 'editor', 'viewer']),
});

export default function App() {
  return (
    <ZodForm
      schema={schema}
      onSubmit={(data) => console.log(data)}
    />
  );
}
`;

function HomepageHeader(): ReactNode {
  const dark = useBaseUrl('img/banner-dark.svg');
  const light = useBaseUrl('img/banner-light.svg');
  return (
    <header className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroLabel}>zod-to-form · MIT · Zod v4</div>
        <div className={styles.heroBanner}>
          <img className={styles.heroBannerDark} src={dark} alt="zod-to-form" />
          <img className={styles.heroBannerLight} src={light} alt="zod-to-form" />
        </div>
        <h1 className={styles.heroTitle}>
          Schema in. <span className={styles.accentTeal}>Form out.</span>
          <br />
          <span className={styles.accentPink}>It's your code.</span>
        </h1>
        <p className={styles.heroSub}>
          This is not a form library. It's a code generator that reads your Zod schemas and gives
          you production-ready React forms — with shadcn/ui, React Hook Form, and full TypeScript
          inference. Use the runtime renderer to iterate, then eject to generated code you fully
          own.
        </p>
        <div className={styles.heroActions}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get Started
          </Link>
          <Link
            className="button button--outline button--lg"
            href="https://github.com/pradeepmouli/zod-to-form"
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function ArchitectureSection(): ReactNode {
  const [activeKey, setActiveKey] = useState<PathKey>('plugin');
  const active = PATHS.find((p) => p.key === activeKey) ?? PATHS[0]!;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Architecture</div>
        <h2 className={styles.sectionTitle}>One walker. Three integration paths.</h2>
        <p className={styles.sectionDesc}>
          Walk your Zod schema once. Pick the path that fits: render at runtime, generate static
          code with the CLI, or let the Vite plugin compile on demand. Same config, same output —
          zero runtime dependency on <code>@zod-to-form/*</code> in the code you ship.
        </p>

        <div className={styles.pathTabs} role="tablist" aria-label="Integration paths">
          {PATHS.map((path) => {
            const isActive = path.key === activeKey;
            return (
              <button
                type="button"
                key={path.key}
                role="tab"
                aria-selected={isActive}
                className={`${styles.pathTab} ${isActive ? styles.pathTabActive : ''}`}
                onClick={() => setActiveKey(path.key)}
              >
                <div className={styles.pathTabLabel}>{path.label}</div>
                <div className={styles.pathTabTagline}>{path.tagline}</div>
                <ol className={styles.pathTabBullets}>
                  {path.bullets.map((b, i) => (
                    <li key={i}>{renderInlineCode(b)}</li>
                  ))}
                </ol>
              </button>
            );
          })}
        </div>

        <div className={styles.pathContent} role="tabpanel" aria-label={active.label}>
          <div className={styles.pathColumn}>
            <div className={styles.pathColumnHeader}>Config</div>
            <PathSnippet snippet={active.leftTop} />
            {active.leftBottom !== null && (
              <>
                <div className={styles.pathConnector}>
                  <span className={styles.pathConnectorPlus}>+</span>
                </div>
                <PathSnippet snippet={active.leftBottom} />
              </>
            )}
          </div>
          <div className={styles.pathColumn}>
            <div className={styles.pathColumnHeader}>Code</div>
            <PathSnippet snippet={active.rightTop} />
            {active.rightBottom !== null && (
              <>
                <div className={styles.pathConnector}>
                  <span className={styles.pathConnectorArrow} aria-hidden>
                    ↓
                  </span>
                </div>
                <PathSnippet snippet={active.rightBottom} />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PathSnippet({
  snippet
}: {
  snippet: { title: string; language: string; source: string };
}): ReactNode {
  return (
    <div className={styles.pathSnippet}>
      <div className={styles.pathSnippetTitle}>{snippet.title}</div>
      <CodeBlock language={snippet.language}>{snippet.source}</CodeBlock>
    </div>
  );
}

/**
 * Render a string with single-backtick segments as <code> spans so the
 * tab bullets can have inline monospace highlights without needing MDX.
 */
function renderInlineCode(text: string): ReactNode {
  const parts = text.split('`');
  return parts.map((part, i) =>
    i % 2 === 1 ? <code key={i}>{part}</code> : <span key={i}>{part}</span>
  );
}

function CodePreviewSection(): ReactNode {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Preview</div>
        <h2 className={styles.sectionTitle}>Define your schema. Get a form.</h2>
        <p className={styles.sectionDesc}>
          No manual field wiring. Labels inferred, validation connected, types propagated to
          onSubmit.
        </p>
        <div className={styles.codeWindow}>
          <div className={styles.codeTitlebar}>
            <div className={styles.codeDots}>
              <span />
              <span />
              <span />
            </div>
            <span className={styles.codeTab}>SignupForm.tsx</span>
          </div>
          <CodeBlock language="tsx">{signupFormCode}</CodeBlock>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection(): ReactNode {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Use Cases</div>
        <h2 className={styles.sectionTitle}>From prototype to production</h2>
        <p className={styles.sectionDesc}>Two paths, one config. Start fast, ship clean.</p>
        <div className={styles.audienceGrid}>
          <div className={`${styles.audienceCard} ${styles.tealAccent}`}>
            <div className={`${styles.audienceTag} ${styles.audienceTagTeal}`}>Rapid Builder</div>
            <h3>Runtime rendering</h3>
            <p>
              Drop in &lt;ZodForm&gt; and get a working form instantly. Perfect for admin panels,
              internal tools, and CRUD forms where speed matters.
            </p>
            <ul className={styles.audienceFeatures}>
              <li>Schema change → form updates on re-render</li>
              <li>shadcn/ui preset — zero component config</li>
              <li>Metadata via Zod v4 registry API</li>
            </ul>
          </div>
          <div className={`${styles.audienceCard} ${styles.pinkAccent}`}>
            <div className={`${styles.audienceTag} ${styles.audienceTagPink}`}>Production Team</div>
            <h3>CLI codegen</h3>
            <p>
              Generate static .tsx files you own. Review diffs, hand-edit, commit. The output has
              zero runtime dependency on zod-to-form.
            </p>
            <ul className={styles.audienceFeatures}>
              <li>Readable output — looks hand-written</li>
              <li>--watch mode for development</li>
              <li>CI-friendly — add to your build pipeline</li>
            </ul>
          </div>
          <div className={`${styles.audienceCard} ${styles.mixedAccent}`}>
            <div className={`${styles.audienceTag} ${styles.audienceTagMixed}`}>Schema-First</div>
            <h3>Both paths, one config</h3>
            <p>
              Start with runtime for iteration. Eject to codegen when you need full control. Same
              z2f.config.ts drives both — component names and overrides carry over.
            </p>
            <ul className={styles.audienceFeatures}>
              <li>Codegen ↔ runtime parity</li>
              <li>Custom field template via config</li>
              <li>Tabs, accordions, steppers via component override</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

type Row = [string, boolean, boolean, boolean, boolean];

const compareRows: Row[] = [
  ['Zod v4 substrate API', true, false, false, false],
  ['Build-time codegen', true, false, false, false],
  ['Zero-dependency eject', true, false, false, false],
  ['React Hook Form', true, true, false, false],
  ['shadcn/ui preset', true, true, false, false],
  ['Controlled component bridging', true, false, false, false],
  ['Field template customization', true, false, false, true],
  ['Discriminated unions', true, false, false, true],
  ['Typed recursive config', true, false, false, false]
];

type PerfRow = {
  schema: string;
  baseline: string;
  z2f: string;
  speedup: string;
  config: string;
};

// Numbers from benchmarks/RESULTS.md (Chromium via Playwright, April 2026).
// Baseline = runtime useZodForm with zodResolver (no optimization).
// z2f = best codegen + L1/L2 configuration per size.
// Session cost = mount + 20 × keystroke + submit (K=20, onChange mode light editing).
const perfRows: PerfRow[] = [
  {
    schema: 'small (5 fields)',
    baseline: '502μs',
    z2f: '397μs',
    speedup: '1.26×',
    config: 'codegen L1'
  },
  {
    schema: 'medium (18 fields)',
    baseline: '1.53ms',
    z2f: '864μs',
    speedup: '1.77×',
    config: 'codegen L2'
  },
  {
    schema: 'large (50 fields)',
    baseline: '2.31ms',
    z2f: '1.68ms',
    speedup: '1.37×',
    config: 'codegen L1'
  }
];

function PerformanceSection(): ReactNode {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Performance</div>
        <h2 className={styles.sectionTitle}>
          Faster than hand-wiring a form. <span className={styles.accentTeal}>By a lot.</span>
        </h2>
        <p className={styles.sectionDesc}>
          We measure the full form lifecycle — mount + keystrokes + submit — against a hand-wired{' '}
          <code>useForm + zodResolver</code> baseline. The build-time walk eliminates per-mount
          optimizer cost, and <strong>native-rules mode</strong> bypasses Zod entirely for fields
          whose constraints can be expressed via <code>minLength</code>, <code>pattern</code>,{' '}
          <code>min</code>, <code>max</code>, and friends.
        </p>
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th>Form size (20 edits)</th>
              <th>Hand-wired + zodResolver</th>
              <th>z2f codegen</th>
              <th>Speedup</th>
              <th>Config</th>
            </tr>
          </thead>
          <tbody>
            {perfRows.map((row) => (
              <tr key={row.schema}>
                <td>{row.schema}</td>
                <td>{row.baseline}</td>
                <td>
                  <strong>{row.z2f}</strong>
                </td>
                <td className={styles.check}>{row.speedup}</td>
                <td>
                  <code>{row.config}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.sectionDesc} style={{ marginTop: '1.5rem' }}>
          On heavy editing sessions (500 edits), the gap widens to{' '}
          <strong>2.08× on medium forms</strong> and <strong>2.00× on large forms</strong> — every
          keystroke in z2f costs ~100ns (a native-rule check) vs ~2.6μs (a full Zod parse) for the
          baseline. That's a{' '}
          <strong>
            <span className={styles.accentPink}>24× per-keystroke speedup</span>
          </strong>{' '}
          on the hot path.
        </p>
        <div className={styles.heroActions} style={{ marginTop: '1rem' }}>
          <Link className="button button--outline button--lg" to="/docs/guides/benchmarks">
            See the full benchmarks →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection(): ReactNode {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Comparison</div>
        <h2 className={styles.sectionTitle}>What sets zod-to-form apart</h2>
        <p className={styles.sectionDesc}>
          The Zod v4 form generation space has several players. None offer codegen, and none use the
          APIs Zod v4 designed for library authors.
        </p>
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th>Capability</th>
              <th>z2f</th>
              <th>AutoForm</th>
              <th>uniforms</th>
              <th>RJSF</th>
            </tr>
          </thead>
          <tbody>
            {compareRows.map(([cap, z, a, u, r]) => (
              <tr key={cap}>
                <td>{cap}</td>
                <td className={z ? styles.check : styles.dash}>{z ? '✓' : '—'}</td>
                <td className={a ? styles.check : styles.dash}>{a ? '✓' : '—'}</td>
                <td className={u ? styles.check : styles.dash}>{u ? '✓' : '—'}</td>
                <td className={r ? styles.check : styles.dash}>{r ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EcosystemSection(): ReactNode {
  return (
    <section className={`${styles.section} ${styles.sectionCentered}`}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Ecosystem</div>
        <h2 className={styles.sectionTitle}>Built on the standards</h2>
        <p className={styles.sectionDesc}>
          No custom runtime. Just Zod, React Hook Form, and your component library.
        </p>
        <div className={styles.ecoBadges}>
          <div className={styles.ecoBadge}>
            <span className={`${styles.ecoDot} ${styles.ecoDotBlue}`} />
            Zod v4
          </div>
          <div className={styles.ecoBadge}>
            <span className={`${styles.ecoDot} ${styles.ecoDotPink}`} />
            React Hook Form
          </div>
          <div className={styles.ecoBadge}>
            <span className={`${styles.ecoDot} ${styles.ecoDotTeal}`} />
            shadcn/ui
          </div>
          <div className={styles.ecoBadge}>
            <span className={`${styles.ecoDot} ${styles.ecoDotGreen}`} />
            @hookform/resolvers
          </div>
          <div className={styles.ecoBadge}>
            <span className={`${styles.ecoDot} ${styles.ecoDotBlue}`} />
            TypeScript
          </div>
          <div className={styles.ecoBadge}>
            <span className={`${styles.ecoDot} ${styles.ecoDotTeal}`} />
            Radix UI
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA(): ReactNode {
  return (
    <div className={styles.cta}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Stop wiring forms by hand</h2>
        <p className={styles.sectionDesc}>Define the schema. Get the form. Keep full control.</p>
        <div className={styles.ctaActions}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get Started →
          </Link>
          <Link
            className="button button--outline button--lg"
            href="https://github.com/pradeepmouli/zod-to-form"
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Schema-driven form generation for Zod v4 — runtime rendering or static codegen you own."
    >
      <div className={styles.page}>
        <HomepageHeader />
        <main>
          <ArchitectureSection />
          <CodePreviewSection />
          <UseCasesSection />
          <PerformanceSection />
          <ComparisonSection />
          <EcosystemSection />
          <FinalCTA />
        </main>
      </div>
    </Layout>
  );
}
