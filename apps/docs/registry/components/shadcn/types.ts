/**
 * Shared prop shape for controlled shadcn field adapters.
 *
 * z2f codegen binds controlled fields to all five RHF field props
 * (`value onChange onBlur ref name`). `ref` is supplied via React.forwardRef,
 * so it is NOT part of this props object — the remaining four (plus the
 * `disabled`/`id` UI props) are. Adapters must accept a SUPERSET of what
 * codegen emits, otherwise `tsc` fails in a real consumer project.
 */
export type ControlledFieldProps<V = unknown> = {
  value?: V;
  onChange?: (value: V) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  id?: string;
};
