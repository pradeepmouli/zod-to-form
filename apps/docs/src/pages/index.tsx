import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import Layout from '@theme/Layout';
import styles from './index.module.css';

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
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Architecture</div>
        <h2 className={styles.sectionTitle}>One walker. Two outputs.</h2>
        <p className={styles.sectionDesc}>
          Walk your Zod schema once. Render at runtime with <code>&lt;ZodForm&gt;</code> or generate
          a static <code>.tsx</code> file with the CLI. Same config, same behavior, zero runtime
          dependency on zod-to-form in generated code.
        </p>
        <div className={styles.whyGrid}>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconTeal}`}>{'{}'}</div>
            <h3>Unified props</h3>
            <p>
              Literal values and RHF field bindings coexist in one <code>props</code> Record. The
              resolver auto-detects <code>field.onChange</code> vs string literals. One API surface
              for everything — grid classes, icons, event handlers.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconPink}`}>⎋</div>
            <h3>Zero-dependency eject</h3>
            <p>
              Generated code depends only on react, react-hook-form, zod, and your own components.
              The shadcn preset needs no normalizer. The html preset inlines one (~30 lines). No{' '}
              <code>@zod-to-form/*</code> at runtime.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconPink}`}>⟁</div>
            <h3>Schema-driven conditionals</h3>
            <p>
              Discriminated unions are first-class. The walker resolves variants, the renderer
              toggles fields, validation stays in sync. No parallel rule system that can drift from
              your schema.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconTeal}`}>⇄</div>
            <h3>Codegen ↔ runtime parity</h3>
            <p>
              The same <code>FieldConfig</code> drives both CLI output and{' '}
              <code>&lt;ZodForm&gt;</code>. Start with runtime rendering. Eject to generated code.
              Component names and prop overrides carry over.
            </p>
          </div>
        </div>
      </div>
    </section>
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
          <ComparisonSection />
          <EcosystemSection />
          <FinalCTA />
        </main>
      </div>
    </Layout>
  );
}
