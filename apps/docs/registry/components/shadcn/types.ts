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

/** Owned copy of the option shape (severs the @zod-to-form/core dependency). */
export interface FormFieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

/** Strips index signatures from an inferred Zod type (mirrors codegen's inline util). */
export type StripIndexSignature<T> = T extends Date | File | FileList | Blob | RegExp
  ? T
  : T extends readonly (infer U)[]
    ? StripIndexSignature<U>[]
    : T extends object
      ? {
          [K in keyof T as string extends K
            ? never
            : number extends K
              ? never
              : symbol extends K
                ? never
                : K]: StripIndexSignature<T[K]>;
        }
      : T;
