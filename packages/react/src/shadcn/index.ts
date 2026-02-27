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
 *     FormItem, FormLabel, FormControl,
 *     FormDescription, FormMessage
 *   }                      from '@/components/ui/form';
 *
 * Then pass the map to <ZodForm>:
 *   <ZodForm schema={schema} onSubmit={...} components={shadcnComponentMap} />
 */

import { createElement, type HTMLAttributes, type LabelHTMLAttributes } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
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

function ShadcnSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return createElement('select', {
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
  });
}

// ─── Shadcn-style FormField wrapper ──────────────────────────────────────────

function ShadcnFormField(props: HTMLAttributes<HTMLDivElement>) {
  return createElement('div', {
    ...props,
    className: ['space-y-2', props.className ?? ''].join(' ').trim()
  });
}

// ─── Shadcn-style FormLabel stub ─────────────────────────────────────────────

function ShadcnFormLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
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

// ─── Shadcn-style FormDescription stub ───────────────────────────────────────

function ShadcnFormDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return createElement('p', {
    ...props,
    className: ['text-sm text-muted-foreground', props.className ?? ''].join(' ').trim()
  });
}

// ─── Shadcn-style FormMessage stub ───────────────────────────────────────────

function ShadcnFormMessage(props: HTMLAttributes<HTMLParagraphElement>) {
  return createElement('p', {
    ...props,
    className: ['text-sm font-medium text-destructive', props.className ?? ''].join(' ').trim()
  });
}

// ─── Assembled shadcn component map ──────────────────────────────────────────
//
// Inherits Checkbox, Switch, DatePicker, FileInput, RadioGroup, Combobox from
// defaultComponentMap; overrides Input, Textarea, Select and all Form wrapper
// components with shadcn/ui-styled stubs.

export const shadcnComponentMap = {
  ...defaultComponentMap,
  Input: ShadcnInput,
  Textarea: ShadcnTextarea,
  Select: ShadcnSelect,
  FormField: ShadcnFormField,
  FormLabel: ShadcnFormLabel,
  FormDescription: ShadcnFormDescription,
  FormMessage: ShadcnFormMessage
};
