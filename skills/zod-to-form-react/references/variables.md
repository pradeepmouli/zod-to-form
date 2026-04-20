# Variables & Constants

## Components

### `defaultComponentMap`
The default HTML-based component map used by `<ZodForm>` and `<FieldRenderer>`.
Maps component names (e.g. `'Input'`, `'Select'`, `'Checkbox'`) to their React implementations.
Pass a subset of this map as `components` to override individual components at the form level.
```ts
const defaultComponentMap: { Input: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; Textarea: MemoExoticComponent<(props: TextareaHTMLAttributes<HTMLTextAreaElement>) => Element>; Checkbox: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; Combobox: MemoExoticComponent<(__namedParameters: ComboboxProps) => Element>; Switch: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; Select: MemoExoticComponent<(__namedParameters: SelectProps) => Element>; DatePicker: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; FileInput: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; RadioGroup: MemoExoticComponent<(__namedParameters: RadioGroupProps) => Element>; Field: (props: HTMLAttributes<HTMLDivElement>) => DetailedReactHTMLElement<HTMLAttributes<HTMLDivElement>, HTMLElement>; FieldLabel: (props: LabelHTMLAttributes<HTMLLabelElement>) => DetailedReactHTMLElement<LabelHTMLAttributes<HTMLLabelElement>, HTMLElement>; FieldDescription: (props: HTMLAttributes<HTMLParagraphElement>) => DetailedReactHTMLElement<HTMLAttributes<HTMLParagraphElement>, HTMLElement>; FieldMessage: (props: HTMLAttributes<HTMLParagraphElement>) => DetailedReactHTMLElement<HTMLAttributes<HTMLParagraphElement>, HTMLElement> }
```

### `shadcnComponentMap`
Component map pre-wired with shadcn/ui-styled implementations.
Extends `defaultComponentMap` by overriding Input, Textarea, Select, and all
Field wrapper components with shadcn/ui Tailwind CSS stubs.

These stubs work without installing shadcn/ui — they apply the shadcn class names
to plain HTML elements. Replace individual entries with real shadcn components
for production use (see module JSDoc above for import instructions).
```ts

<!-- truncated -->
