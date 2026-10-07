// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '@zod-to-form/core';
import { App } from '../../src/App.tsx';
import { CodeOutput } from '../../src/components/preview/CodeOutput.tsx';
import { formValuesToConfig } from '../../src/lib/config-schema.ts';

const source = `const formRegistry = z.registry();
const schema = z.object({ name: z.string().min(3).refine(v => v !== 'blocked', { message: 'Blocked' }).register(formRegistry, { title: 'Registered name' }) });
({ schema, formRegistry });`;
const fields = walkSchema(
  z.object({
    name: z
      .string()
      .min(3)
      .refine((v) => v !== 'blocked', { message: 'Blocked' })
  })
);
const emptyComponents = {};
const initialConfig = {
  components: { source: './components', preset: 'html' as const },
  fields: {
    name: { label: 'Configured name', component: 'Textarea' },
    'items[].secret': { hidden: true }
  },
  defaults: { optimization: { level: 2 as const, compileZod: true } }
};
const preview = vi.hoisted(() => vi.fn());
vi.mock('@zod-to-form/react', async (original) => ({
  ...(await original<typeof import('@zod-to-form/react')>()),
  ZodForm: (props: unknown) => {
    preview(props);
    return null;
  }
}));
vi.mock('../../src/hooks/usePlaygroundState.ts', async () => {
  const { useState } = await import('react');
  return {
    usePlaygroundState: () => {
      const [config, setConfig] = useState(initialConfig);
      return {
        state: {
          config,
          editorContent: source,
          componentMap: 'default',
          codeOutputMode: 'cli',
          customComponents: emptyComponents,
          lastValidFields: fields,
          configTab: 'form',
          activeTab: 'preview',
          activePane: 'preview'
        },
        setConfig,
        setEditorContent: vi.fn(),
        setComponentMap: vi.fn(),
        setActiveTab: vi.fn(),
        setActivePane: vi.fn(),
        setSubmitResult: vi.fn(),
        setCustomComponents: vi.fn(),
        setConfigTab: vi.fn(),
        setCodeOutputMode: vi.fn(),
        setPaneSizes: vi.fn()
      };
    }
  };
});
vi.mock('../../src/hooks/useDebouncedEval.ts', () => ({
  useDebouncedEval: () => ({ fields, error: null, isEvaluating: false })
}));
vi.mock('../../src/hooks/useShadcnComponents.ts', () => ({
  useShadcnComponents: () => ({ components: {}, errors: {} })
}));
vi.mock('../../src/components/layout/Header.tsx', () => ({ Header: () => null }));
vi.mock('../../src/components/layout/PlaygroundShell.tsx', () => ({
  PlaygroundShell: (p: any) => (
    <>
      {p.configPane}
      {p.preview}
      {p.codeOutput}
    </>
  )
}));
vi.mock('../../src/components/inspect/IRInspector.tsx', () => ({ IRInspector: () => null }));
vi.mock('../../src/components/preview/CodeViewer.tsx', () => ({
  CodeViewer: (p: any) => <pre data-testid="generated">{p.value}</pre>
}));
vi.mock('../../src/components/config/ConfigPane.tsx', () => ({
  ConfigPane: (p: any) => (
    <button
      onClick={() =>
        p.onConfigChange({ ...initialConfig, defaults: { optimization: { compileZod: true } } })
      }
    >
      Compile only
    </button>
  )
}));
vi.mock('../../src/components/config/ConfigForm.tsx', () => ({
  ConfigForm: (p: any) => (
    <button onClick={() => p.onChange({ fields: { name: { label: 'Edited' } } })}>
      Edit label
    </button>
  )
}));
vi.mock('../../src/components/config/ConfigTsEditor.tsx', () => ({ ConfigTsEditor: () => null }));

describe('canonical config integration', () => {
  it('App forwards optimization and config into preview and generates replacement validation', () => {
    render(<App />);
    expect(preview).toHaveBeenLastCalledWith(
      expect.objectContaining({
        optimization: { level: 2, compileZod: true },
        componentConfig: expect.objectContaining({
          fields: expect.objectContaining({
            name: expect.objectContaining({ label: 'Configured name' })
          })
        })
      })
    );
    fireEvent.click(screen.getByText('Compile only'));
    expect(preview).toHaveBeenLastCalledWith(
      expect.objectContaining({ optimization: { compileZod: true } })
    );
    expect(screen.getByTestId('generated').textContent).toContain('zodResolver');
    expect(screen.getByTestId('generated').textContent).toContain('compile(schema)');
  });

  it('App emits optimized field validation and authored metadata', () => {
    render(<App />);
    expect(screen.getByTestId('generated').textContent).toContain('minLength');
    expect(screen.getByTestId('generated').textContent).toContain('Textarea');
    expect(screen.getByTestId('generated').textContent).toContain('Registered name');
    expect(screen.getByTestId('generated').textContent).toContain('safeParse');
  });

  it('refuses optimized output without an evaluated schema', () => {
    render(
      <CodeOutput
        fields={fields}
        componentMap="default"
        customComponentNames={[]}
        config={initialConfig}
        codeOutputMode="cli"
        onCodeOutputModeChange={vi.fn()}
        editorContent=""
      />
    );
    expect(screen.queryByTestId('generated')).toBeNull();
    expect(screen.getByText(/Code generation error/)).toBeDefined();
  });

  it('ConfigPane retains nested authored fields while editing a displayed field', async () => {
    const { ConfigPane } = await vi.importActual<
      typeof import('../../src/components/config/ConfigPane.tsx')
    >('../../src/components/config/ConfigPane.tsx');
    const changed = vi.fn();
    render(
      <ConfigPane
        fields={fields}
        config={initialConfig}
        componentMap="default"
        configTab="form"
        customComponentNames={[]}
        compiledComponents={{}}
        onConfigTabChange={vi.fn()}
        onConfigChange={changed}
      />
    );
    fireEvent.click(screen.getByText('Edit label'));
    expect(changed).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({
          name: expect.objectContaining({ label: 'Edited' }),
          'items[].secret': { hidden: true }
        })
      })
    );
  });

  it('explicit clears remove owned properties while unexposed metadata survives', () => {
    const result = formValuesToConfig(
      { fields: { name: { label: undefined } }, defaults: { optimization: { level: undefined } } },
      initialConfig
    );
    expect(result.fields?.name?.label).toBeUndefined();
    expect(result.fields?.['items[].secret']).toEqual({ hidden: true });
    expect(result.defaults?.optimization).toEqual({ compileZod: true });
  });
});
