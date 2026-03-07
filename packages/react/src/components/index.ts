import { createElement } from 'react';
import type { HTMLAttributes, LabelHTMLAttributes } from 'react';
import { Checkbox } from './Checkbox.js';
import { ComboboxFallback } from './Combobox.js';
import { DatePicker } from './DatePicker.js';
import { FileInput } from './FileInput.js';
import { Input } from './Input.js';
import { RadioGroup } from './RadioGroup.js';
import { Select } from './Select.js';
import { Switch } from './Switch.js';
import { Textarea } from './Textarea.js';

function Field(props: HTMLAttributes<HTMLDivElement>) {
  return createElement('div', props);
}

function FieldLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return createElement('label', props);
}

function FieldDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return createElement('p', props);
}

function FieldMessage(props: HTMLAttributes<HTMLParagraphElement>) {
  return createElement('p', props);
}

export const defaultComponentMap = {
  Input,
  Textarea,
  Checkbox,
  Combobox: ComboboxFallback,
  Switch,
  Select,
  DatePicker,
  FileInput,
  RadioGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldMessage
};
