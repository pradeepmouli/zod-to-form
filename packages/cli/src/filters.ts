export function wildcardPatternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function matchesAnyPattern(value: string, patterns: string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) {
    return true;
  }

  return patterns.some((pattern) => wildcardPatternToRegExp(pattern).test(value));
}

export function applyExportFilters(
  exports: string[],
  include: string[] | undefined,
  exclude: string[] | undefined
): string[] {
  const included = exports.filter((name) => matchesAnyPattern(name, include));
  if (!exclude || exclude.length === 0) {
    return included;
  }

  return included.filter((name) => !matchesAnyPattern(name, exclude));
}
