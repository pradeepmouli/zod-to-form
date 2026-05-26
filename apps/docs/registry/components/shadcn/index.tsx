/**
 * Aggregated exports for all shadcn field adapter components.
 * Provides both named re-exports and a keyed `components` map for
 * the @zod-to-form/react runtime component registry.
 */
export { Input } from './input.js';
export { Textarea } from './textarea.js';
export { Checkbox } from './checkbox.js';
export { Switch } from './switch.js';
export { Select } from './select.js';
export { RadioGroup } from './radio-group.js';
export { DatePicker } from './date-picker.js';

import { Input } from './input.js';
import { Textarea } from './textarea.js';
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
