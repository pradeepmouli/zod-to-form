import { describe, it, expect } from 'vitest';
import { compileComponent, compileComponents } from '../../src/lib/component-compiler.ts';

describe('component-compiler', () => {
  it('compiles a simple React component', () => {
    const source = `
      import * as React from "react";
      import { cn } from "@/lib/utils";

      const MyInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
        ({ className, ...props }, ref) => (
          <input
            className={cn("border rounded px-2 py-1", className)}
            ref={ref}
            {...props}
          />
        )
      );
      MyInput.displayName = "MyInput";
      export { MyInput };
    `;
    const result = compileComponent('my-input', source);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.exportName).toBe('MyInput');
      expect(typeof result.component).toBe('object');
    }
  });

  it('compiles a plain function component', () => {
    const source = `
      import * as React from "react";
      export function Badge({ children, className }) {
        return React.createElement("span", { className: className || "badge" }, children);
      }
    `;
    const result = compileComponent('badge', source);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.component).toBe('function');
    }
  });

  it('returns error for missing dependencies', () => {
    const source = `
      import * as React from "react";
      import * as SomeLib from "some-unknown-library";
      export function Comp() { return React.createElement(SomeLib.Widget); }
    `;
    const result = compileComponent('comp', source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('some-unknown-library');
    }
  });

  it('returns error when no component is exported', () => {
    const source = `
      const x = 42;
    `;
    const result = compileComponent('x', source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('No React component');
    }
  });

  it('compiles multiple components via compileComponents', () => {
    const sources = {
      'good-comp': `
        import * as React from "react";
        export function GoodComp() { return React.createElement("div", null, "hello"); }
      `,
      'bad-comp': `
        this is not valid javascript at all!!!
      `
    };
    const { components, errors } = compileComponents(sources);
    expect(Object.keys(components)).toHaveLength(1);
    expect(components['GoodComp']).toBeDefined();
    expect(Object.keys(errors)).toHaveLength(1);
    expect(errors['bad-comp']).toBeDefined();
  });

  it('multi-pass resolves cross-component dependencies', () => {
    const sources = {
      // ComponentB depends on ComponentA — requires second pass
      'component-a': `
        import * as React from "react";
        export function ComponentA({ children }) {
          return React.createElement("div", { className: "wrapper" }, children);
        }
      `,
      'component-b': `
        import * as React from "react";
        import { ComponentA } from "./component-a";
        export function ComponentB() {
          return React.createElement(ComponentA, null, "nested");
        }
      `
    };
    const { components, errors } = compileComponents(sources);
    expect(Object.keys(errors)).toHaveLength(0);
    expect(components['ComponentA']).toBeDefined();
    expect(components['ComponentB']).toBeDefined();
  });

  it('reports circular dependency when neither component can resolve', () => {
    const sources = {
      'comp-x': `
        import * as React from "react";
        import { CompY } from "./comp-y";
        export function CompX() { return React.createElement(CompY); }
      `,
      'comp-y': `
        import * as React from "react";
        import { CompX } from "./comp-x";
        export function CompY() { return React.createElement(CompX); }
      `
    };
    const { errors } = compileComponents(sources);
    // At least one should fail since they can't both resolve
    expect(Object.keys(errors).length).toBeGreaterThanOrEqual(1);
  });

  it('resolves CSS imports via stub', () => {
    const source = `
      import * as React from "react";
      import "./styles.css";
      export function StyledComp() { return React.createElement("div", null, "styled"); }
    `;
    const result = compileComponent('styled-comp', source);
    expect(result.ok).toBe(true);
  });

  it('resolves @radix-ui imports', () => {
    const source = `
      import * as React from "react";
      import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
      import { cn } from "@/lib/utils";

      const Checkbox = React.forwardRef(({ className, ...props }, ref) =>
        React.createElement(CheckboxPrimitive.Root, {
          ref,
          className: cn("h-4 w-4", className),
          ...props,
        })
      );
      Checkbox.displayName = "Checkbox";
      export { Checkbox };
    `;
    const result = compileComponent('checkbox', source);
    expect(result.ok).toBe(true);
  });

  it('resolves class-variance-authority', () => {
    const source = `
      import * as React from "react";
      import { cva } from "class-variance-authority";
      import { cn } from "@/lib/utils";

      const buttonVariants = cva("inline-flex items-center", {
        variants: { size: { sm: "h-8", lg: "h-12" } },
        defaultVariants: { size: "sm" },
      });

      export function Button({ className, size, ...props }) {
        return React.createElement("button", {
          className: cn(buttonVariants({ size }), className),
          ...props,
        });
      }
    `;
    const result = compileComponent('button', source);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.component).toBe('function');
    }
  });
});
