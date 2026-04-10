# Variables & Constants

## `defaultComponentMap`
```ts
const defaultComponentMap: { Input: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; Textarea: MemoExoticComponent<(props: TextareaHTMLAttributes<HTMLTextAreaElement>) => Element>; Checkbox: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; Combobox: MemoExoticComponent<(__namedParameters: ComboboxProps) => Element>; Switch: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; Select: MemoExoticComponent<(__namedParameters: SelectProps) => Element>; DatePicker: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; FileInput: MemoExoticComponent<(props: InputHTMLAttributes<HTMLInputElement>) => Element>; RadioGroup: MemoExoticComponent<(__namedParameters: RadioGroupProps) => Element>; Field: (props: HTMLAttributes<HTMLDivElement>) => DetailedReactHTMLElement<HTMLAttributes<HTMLDivElement>, HTMLElement>; FieldLabel: (props: LabelHTMLAttributes<HTMLLabelElement>) => DetailedReactHTMLElement<LabelHTMLAttributes<HTMLLabelElement>, HTMLElement>; FieldDescription: (props: HTMLAttributes<HTMLParagraphElement>) => DetailedReactHTMLElement<HTMLAttributes<HTMLParagraphElement>, HTMLElement>; FieldMessage: (props: HTMLAttributes<HTMLParagraphElement>) => DetailedReactHTMLElement<HTMLAttributes<HTMLParagraphElement>, HTMLElement> }
```

## `FIELD_COMPONENT_NAMES`
User-facing field component names derived from defaultComponentMap, excluding internal wrappers
```ts
const FIELD_COMPONENT_NAMES: readonly string[]
```

## `shadcnComponentMap`
```ts

<!-- truncated -->
