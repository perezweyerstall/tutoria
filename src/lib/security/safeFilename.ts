import path from 'node:path';

const RESERVED_BASENAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
]);

export interface SafeFilenameOptions {
  fallback?: string;
  extension?: string;
  maxLength?: number;
}

/**
 * Produces a strictly safe, portable, traversal-free filename.
 */
export function toSafeFilename(rawName: string, options: SafeFilenameOptions = {}): string {
  const fallback = options.fallback ?? 'tutoria-file';
  const maxLength = Math.max(8, Math.min(options.maxLength ?? 64, 120));

  const normalizedInput = String(rawName ?? '')
    .replace(/\0/g, '')
    .replace(/\\/g, '/');

  // Take last non-dot-dot path segment if slashes were supplied
  const segments = normalizedInput
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== '.' && part !== '..');

  const leaf = segments.length > 0 ? segments[segments.length - 1] : fallback;

  // Determine explicit or inferred extension
  let explicitExt = options.extension ?? '';
  let stemCandidate = leaf;

  if (!explicitExt) {
    const extMatch = leaf.match(/\.([a-zA-Z0-9]{1,10})$/);
    if (extMatch) {
      explicitExt = `.${extMatch[1].toLowerCase()}`;
      stemCandidate = leaf.slice(0, -explicitExt.length);
    }
  } else {
    const cleanExt = explicitExt.replace(/^\.+/, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    explicitExt = cleanExt ? `.${cleanExt.slice(0, 10)}` : '';
    if (explicitExt && stemCandidate.toLowerCase().endsWith(explicitExt)) {
      stemCandidate = stemCandidate.slice(0, -explicitExt.length);
    }
  }

  let safeStem = stemCandidate
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .toLowerCase();

  if (!safeStem) {
    safeStem = fallback
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'tutoria-file';
  }

  if (RESERVED_BASENAMES.has(safeStem)) {
    safeStem = `file-${safeStem}`;
  }

  const allowedStemLen = Math.max(4, maxLength - explicitExt.length);
  safeStem = safeStem.slice(0, allowedStemLen).replace(/[-_]+$/g, '') || 'file';

  return `${safeStem}${explicitExt}`;
}

/**
 * Resolves a filename strictly inside a target base directory and throws if containment fails.
 */
export function resolveSafeChildPath(
  baseDir: string,
  rawFilename: string,
  options?: SafeFilenameOptions
): { safeFilename: string; fullPath: string } {
  const resolvedBase = path.resolve(baseDir);
  const safeFilename = toSafeFilename(rawFilename, options);
  const fullPath = path.resolve(resolvedBase, safeFilename);
  const relative = path.relative(resolvedBase, fullPath);

  if (
    !relative ||
    relative.startsWith('..') ||
    path.isAbsolute(relative) ||
    relative.includes(path.sep)
  ) {
    throw new Error('Unsafe filename rejected outside target directory.');
  }

  return { safeFilename, fullPath };
}
