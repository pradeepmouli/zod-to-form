/**
 * shadcnComponentMap — component map wired to shadcn/ui-compatible components.
 *
 * These implementations are shadcn/ui-style stubs that work out of the box
 * without requiring shadcn/ui to be installed in the consumer's project.
 *
 * To use REAL shadcn/ui components, replace each entry below with the
 * corresponding import from your project's generated shadcn files:
 *
 *   import { Input }       from '@/components/ui/input';
 *   import { Textarea }    from '@/components/ui/textarea';
 *   import { Checkbox }    from '@/components/ui/checkbox';
 *   import { Switch }      from '@/components/ui/switch';
 *   import {
 *     Select, SelectTrigger, SelectValue,
 *     SelectContent, SelectItem
 *   }                      from '@/components/ui/select';
 *   import { Button }      from '@/components/ui/button';
 *   import {
 *     Field, FieldLabel,
 *     FieldDescription, FieldMessage
 *   }                      from '@/components/ui/field';
 *
 * Then pass the map to <ZodForm>:
 *   <ZodForm schema={schema} onSubmit={...} components={shadcnComponentMap} />
 */

import { createElement, type HTMLAttributes, type LabelHTMLAttributes } from 'react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from 'react';
import type { FormFieldOption } from '@zod-to-form/core';
import { defaultComponentMap } from '../components/index.js';

// ─── Shadcn-style Input stub ──────────────────────────────────────────────────

function ShadcnInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return createElement('input', {
    ...props,
    className: [
      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1',
      'text-sm shadow-sm transition-colors placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.className ?? ''
    ]
      .join(' ')
      .trim()
  });
}

// ─── Shadcn-style Checkbox stub ──────────────────────────────────────────────

function ShadcnCheckbox(props: InputHTMLAttributes<HTMLInputElement>) {
  return createElement('input', {
    type: 'checkbox',
    ...props,
    className: [
      'mt-1 h-4 w-4 shrink-0 rounded-sm border border-primary shadow',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.className ?? ''
    ]
      .join(' ')
      .trim()
  });
}

// ─── Shadcn-style Textarea stub ───────────────────────────────────────────────

function ShadcnTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return createElement('textarea', {
    ...props,
    className: [
      'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2',
      'text-sm shadow-sm placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.className ?? ''
    ]
      .join(' ')
      .trim()
  });
}

// ─── Shadcn-style Select stub ─────────────────────────────────────────────────

type ShadcnSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options?: FormFieldOption[];
};

function ShadcnSelect({ options, ...props }: ShadcnSelectProps) {
  return createElement(
    'select',
    {
      ...props,
      className: [
        'flex h-9 w-full items-center justify-between rounded-md border border-input',
        'bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background',
        'focus:outline-none focus:ring-1 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.className ?? ''
      ]
        .join(' ')
        .trim()
    },
    ...(options ?? []).map((option) =>
      createElement(
        'option',
        {
          key: `${option.value}`,
          value: option.value,
          disabled: option.disabled
        },
        option.label
      )
    )
  );
}

// ─── Shadcn-style Field wrapper ──────────────────────────────────────────────

function ShadcnField(props: HTMLAttributes<HTMLDivElement>) {
  return createElement('div', {
    ...props,
    className: ['space-y-2', props.className ?? ''].join(' ').trim()
  });
}

// ─── Shadcn-style FieldLabel stub ────────────────────────────────────────────

function ShadcnFieldLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return createElement('label', {
    ...props,
    className: [
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      props.className ?? ''
    ]
      .join(' ')
      .trim()
  });
}

// ─── Shadcn-style FieldDescription stub ──────────────────────────────────────

function ShadcnFieldDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return createElement('p', {
    ...props,
    className: ['text-sm text-muted-foreground', props.className ?? ''].join(' ').trim()
  });
}

// ─── Shadcn-style FieldMessage stub ──────────────────────────────────────────

function ShadcnFieldMessage(props: HTMLAttributes<HTMLParagraphElement>) {
  return createElement('p', {
    ...props,
    className: ['text-sm font-medium text-destructive', props.className ?? ''].join(' ').trim()
  });
}

// ─── Shadcn-style Array Buttons ──────────────────────────────────────────────

function ShadcnArrayAddButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return createElement(
    'button',
    {
      ...props,
      type: 'button',
      className: [
        'inline-flex items-center justify-center gap-1 rounded-md border border-input',
        'bg-background px-3 py-1.5 text-sm font-medium shadow-sm',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        props.className ?? ''
      ]
        .join(' ')
        .trim()
    },
    props.children ?? '+ Add'
  );
}

function ShadcnArrayRemoveButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return createElement(
    'button',
    {
      ...props,
      type: 'button',
      className: [
        'inline-flex items-center justify-center rounded-md px-2 py-1 text-xs',
        'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
        'disabled:pointer-events-none disabled:opacity-50',
        props.className ?? ''
      ]
        .join(' ')
        .trim()
    },
    props.children ?? '− Remove'
  );
}

// ─── Assembled shadcn component map ──────────────────────────────────────────
//
// Inherits Checkbox, Switch, DatePicker, FileInput, RadioGroup, Combobox from
// defaultComponentMap; overrides Input, Textarea, Select and all Field wrapper
// components with shadcn/ui-styled stubs.

/**
 * Component map pre-wired with shadcn/ui-styled implementations.
 * Extends `defaultComponentMap` by overriding Input, Textarea, Select, and all
 * Field wrapper components with shadcn/ui Tailwind CSS stubs.
 *
 * These stubs work without installing shadcn/ui — they apply the shadcn class names
 * to plain HTML elements. Replace individual entries with real shadcn components
 * for production use (see module JSDoc above for import instructions).
 *
 * @useWhen
 * - Your project uses shadcn/ui and you want styled form components out of the box
 * - You are prototyping with the shadcn preset before wiring up real shadcn components
 *
 * @category Components
 */
export const shadcnComponentMap = {
  ...defaultComponentMap,
  Input: ShadcnInput,
  Checkbox: ShadcnCheckbox,
  Textarea: ShadcnTextarea,
  Select: ShadcnSelect,
  Field: ShadcnField,
  FieldLabel: ShadcnFieldLabel,
  FieldDescription: ShadcnFieldDescription,
  FieldMessage: ShadcnFieldMessage,
  ArrayAddButton: ShadcnArrayAddButton,
  ArrayRemoveButton: ShadcnArrayRemoveButton
};
