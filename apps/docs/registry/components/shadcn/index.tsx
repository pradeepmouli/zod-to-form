/**
 * Aggregated exports for the shadcn zod-form adapter module.
 * Input/Textarea/Checkbox/Switch are thin re-exports of the raw shadcn ui/*
 * primitives — no z2f wrapper needed. Select/RadioGroup/DatePicker retain
 * local adapter files that normalise to the plain value/onChange field shape.
 */
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Checkbox } from '@/components/ui/checkbox';
export { Switch } from '@/components/ui/switch';
export { Select } from './select.js';
export { RadioGroup } from './radio-group.js';
export { DatePicker } from './date-picker.js';

// Re-export the shadcn Form* layout primitives so codegen/?z2f-generated forms
// can import BOTH the field components AND the field-template wrappers from the
// single `@/components/zod-form` module. These are template wrappers, NOT field
// components — they are deliberately absent from the `components` map below.
export {
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
  FormDescription,
  FormField
} from '@/components/ui/form';

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
