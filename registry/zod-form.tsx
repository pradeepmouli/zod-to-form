"use client";

import { ZodForm, shadcnComponentMap } from "@zod-to-form/react";
import type { ComponentProps } from "react";

type ZodFormProps = Omit<ComponentProps<typeof ZodForm>, "components">;

export default function ShadcnZodForm(props: ZodFormProps) {
  return <ZodForm {...props} components={shadcnComponentMap} />;
}

export { ZodForm, shadcnComponentMap };
