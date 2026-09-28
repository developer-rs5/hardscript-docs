/**
 * Where the project is on disk.
 *
 * Its own module, because `REPO_ROOT` is needed by the app (to read the content
 * tree) and by the scripts (to find the compiler). When it lived in the
 * compiler module, the app's server bundle imported `child_process` and the
 * whole diagnostic-parsing surface to learn a path.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The `hard-docs` checkout. */
export const REPO_ROOT = join(HERE, "..", "..");

/** The MDX content tree. */
export const CONTENT_DIR = join(REPO_ROOT, "content", "docs");
