/**
 * Aggregated exports for the shadcn zod-form adapter module.
 * Input/Textarea/Checkbox/Switch are thin re-exports of raw shadcn ui/* primitives.
 * Select/RadioGroup/DatePicker are local wrappers that normalize complex bindings.
 * Field* layout primitives come from @/components/ui/field (Base UI, Oct 2025).
 */
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Checkbox } from '@/components/ui/checkbox';
export { Switch } from '@/components/ui/switch';
export { Select } from './select.js';
export { RadioGroup } from './radio-group.js';
export { DatePicker } from './date-picker.js';

// Re-export the Base UI Field* layout primitives so codegen/?z2f-generated forms
// can import BOTH the field components AND the field-template wrappers from the
// single `@/components/z2f` module. These are template wrappers, NOT field
// components — they are deliberately absent from the `components` map below.
export { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field';

export type { StripIndexSignature, FormFieldOption, ControlledFieldProps } from './types.js';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
