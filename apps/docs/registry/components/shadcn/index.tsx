/**
 * Aggregated exports for the shadcn zod-form adapter module.
 * Input/Textarea are thin re-exports of the raw shadcn ui/* primitives.
 * Checkbox/Switch/Select/RadioGroup/DatePicker are local forwardRef adapters
 * that normalise to the uniform ControlledFieldProps (value/onChange/onBlur/ref).
 * Field* layout primitives come from @/components/ui/field (Base UI, Oct 2025).
 */
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Checkbox } from './checkbox.js';
export { Switch } from './switch.js';
export { Select } from './select.js';
export { RadioGroup } from './radio-group.js';
export { DatePicker } from './date-picker.js';

// Re-export the Base UI Field* layout primitives so codegen/?z2f-generated forms
// can import BOTH the field components AND the field-template wrappers from the
// single `@/components/zod-form` module. These are template wrappers, NOT field
// components — they are deliberately absent from the `components` map below.
export { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field';

export type { StripIndexSignature, FormFieldOption, ControlledFieldProps } from './types.js';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from './checkbox.js';
import { Switch } from './switch.js';
import { Select } from './select.js';
import { RadioGroup } from './radio-group.js';
import { DatePicker } from './date-picker.js';

export const components = {
  Input,
  Textarea,
  Checkbox,
  Switch,
  Select,
  RadioGroup,
  DatePicker
};
