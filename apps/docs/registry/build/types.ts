export type RegistryItemFile = {
  path: string;
  type: 'registry:file' | 'registry:component' | 'registry:lib';
  content?: string;
  target: string;
};

export type RegistryItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json';
  name: string;
  type: 'registry:block';
  title: string;
  description: string;
  dependencies: string[];
  devDependencies?: string[];
  registryDependencies: string[];
  files: RegistryItemFile[];
  docs: string;
};

export type RegistryIndex = {
  $schema: 'https://ui.shadcn.com/schema/registry.json';
  name: '@zod-to-form';
  homepage: 'https://zod.toform.dev';
  items: RegistryItem[];
};
