'use client';

import { ZodForm as BaseZodForm, shadcnComponentMap } from '@zod-to-form/react';
import type { ComponentProps } from 'react';

type ZodFormProps = Omit<ComponentProps<typeof BaseZodForm>, 'components'>;

export default function ShadcnZodForm(props: ZodFormProps) {
  return <BaseZodForm {...props} components={shadcnComponentMap} />;
}

export { ShadcnZodForm as ZodForm, BaseZodForm, shadcnComponentMap };
