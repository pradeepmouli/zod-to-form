import { watch as chokidarWatch, type FSWatcher } from 'chokidar';

const DEBOUNCE_MS = 200;

/**
 * Start watching a schema file for changes.
 * Debounces rapid changes by 200ms before calling regenerate().
 *
 * @param schemaPath - Absolute path to the schema file to watch
 * @param regenerate - Async callback to invoke after a debounced change event
 * @returns The chokidar FSWatcher instance (with patched close() for state tracking)
 */
export async function startWatch(
  schemaPath: string,
  regenerate: () => Promise<void>
): Promise<FSWatcher> {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const watcher = chokidarWatch(schemaPath, {
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('change', (file: string) => {
    if (closed) return;

    console.log(`Change detected: ${file}`);

    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (closed) return;

      regenerate()
        .then(() => {
          console.log('Regeneration complete.');
        })
        .catch((err: unknown) => {
          console.error('Regeneration failed:', err);
        });
    }, DEBOUNCE_MS);
  });

  // Patch close() to set the closed flag and clear any pending debounce
  const nativeClose = watcher.close.bind(watcher);
  // eslint-disable-next-line @typescript-eslint/require-await -- wrapping native close for flag tracking
  watcher.close = async (): Promise<void> => {
    closed = true;
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    return nativeClose();
  };

  return watcher;
}
