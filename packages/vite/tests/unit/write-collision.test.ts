import { describe, expect, it } from 'vitest';
import { checkWriteCollision } from '../../src/write-guard.js';

/**
 * Contract: checkWriteCollision is the pure side of the disk-write
 * collision guard. Given a target output path, the existing file
 * contents (if any), and the plugin's record of what it has emitted
 * during the current run, decide whether writing is safe.
 *
 * Three states:
 * - File doesn't exist → safe to write
 * - File exists AND was emitted by this plugin run → safe to overwrite
 *   (we're updating our own output)
 * - File exists AND was NOT emitted by this plugin run → throw
 *   Z2F_VITE_WOULD_CLOBBER_FILE (FR-007: don't clobber committed files)
 *
 * Closes finding M1 from /speckit.analyze.
 */
describe('checkWriteCollision', () => {
  it('returns "write" when the target path does not exist', () => {
    const decision = checkWriteCollision({
      targetPath: '/abs/out/SignupForm.generated.tsx',
      existingContents: null,
      emittedThisRun: new Set()
    });
    expect(decision).toBe('write');
  });

  it('returns "write" when the target path exists AND was emitted by this run', () => {
    const decision = checkWriteCollision({
      targetPath: '/abs/out/SignupForm.generated.tsx',
      existingContents: '/* generated */',
      emittedThisRun: new Set(['/abs/out/SignupForm.generated.tsx'])
    });
    expect(decision).toBe('write');
  });

  it('throws Z2F_VITE_WOULD_CLOBBER_FILE when the target exists and was NOT emitted by this run', () => {
    expect(() =>
      checkWriteCollision({
        targetPath: '/abs/out/SignupForm.generated.tsx',
        existingContents: '/* hand-written or committed by CLI */',
        emittedThisRun: new Set()
      })
    ).toThrow(/Z2F_VITE_WOULD_CLOBBER_FILE/);
  });

  it('error message includes the conflicting path so the user can find it', () => {
    try {
      checkWriteCollision({
        targetPath: '/abs/out/SignupForm.generated.tsx',
        existingContents: 'committed',
        emittedThisRun: new Set()
      });
      expect.fail('Expected throw');
    } catch (err) {
      expect((err as Error).message).toContain('/abs/out/SignupForm.generated.tsx');
    }
  });

  it('treats an empty file the same as an existing file (still throws)', () => {
    expect(() =>
      checkWriteCollision({
        targetPath: '/abs/out/x.tsx',
        existingContents: '',
        emittedThisRun: new Set()
      })
    ).toThrow(/Z2F_VITE_WOULD_CLOBBER_FILE/);
  });
});
