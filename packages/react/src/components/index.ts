import { createElement } from 'react';
import type { HTMLAttributes, LabelHTMLAttributes } from 'react';
import { Checkbox } from './Checkbox.js';
import { DatePicker } from './DatePicker.js';
import { FileInput } from './FileInput.js';
import { Input } from './Input.js';
import { RadioGroup } from './RadioGroup.js';
import { Select } from './Select.js';
import { Switch } from './Switch.js';
import { Textarea } from './Textarea.js';

function FormField(props: HTMLAttributes<HTMLDivElement>) {
  return createElement('div', props);
}

function FormLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return createElement('label', props);
}

function FormDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return createElement('p', props);
}

function FormMessage(props: HTMLAttributes<HTMLParagraphElement>) {
  return createElement('p', props);
}

export const defaultComponentMap = {
  Input,
  Textarea,
  Checkbox,
  Switch,
  Select,
  DatePicker,
  FileInput,
  RadioGroup,
  FormField,
  FormLabel,
  FormDescription,
  FormMessage
};
