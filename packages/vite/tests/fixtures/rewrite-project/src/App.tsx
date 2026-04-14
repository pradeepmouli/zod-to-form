// Fixture source for rewrite-mode integration test.
//
// Contains:
//   1. A happy-path <ZodForm schema={signupSchema}> that the plugin
//      should rewrite into a generated component.
//   2. (Indirectly via comments) a coexisting ?z2f explicit import in
//      a sibling file — exercised by a separate import in OtherEntry.
import { ZodForm } from '@zod-to-form/react';
import { signupSchema } from './schemas/signup';

export function App(): unknown {
  return <ZodForm schema={signupSchema} onSubmit={(d: unknown) => console.log(d)} />;
}
