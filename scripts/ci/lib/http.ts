/**
 * One HTTP request, checked.
 *
 * A deploy check that reports "200" without saying what it looked for is how a
 * deploy passes while a page is empty. Every check states an expectation, and
 * the failure says which one broke.
 */

export type Result = {
  label: string;
  ok: boolean;
  detail?: string;
  /** The body, kept only when a body assertion fails. */
  body?: string;
};

export type CheckSpec = {
  path: string;
  expect: number;
  contains?: string[];
  absent?: string[];
  headers?: Record<string, (value: string) => boolean>;
  label?: string;
  note?: string;
};

const TIMEOUT_MS = 20_000;

export async function check(base: string, spec: CheckSpec, attempt = 1): Promise<Result> {
  const label = spec.label ?? spec.path;
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(`${base}${spec.path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "hardscript-docs-deploy-check" },
    });
  } catch (err) {
    // A dropped connection is not a broken deploy, and a check that cries wolf
    // is a check people learn to ignore. One retry, and only for a network-level
    // failure — a 404 is an answer, not a fluke.
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 750));
      return check(base, spec, attempt + 1);
    }
    return {
      label,
      ok: false,
      detail: `request failed twice: ${(err as Error).message}`,
    };
  }

  const ms = Date.now() - started;
  if (response.status !== spec.expect) {
    return { label, ok: false, detail: `expected ${spec.expect}, got ${response.status}` };
  }

  for (const [header, predicate] of Object.entries(spec.headers ?? {})) {
    const value = response.headers.get(header) ?? "";
    if (!predicate(value)) {
      return { label, ok: false, detail: `${header}: ${value || "(absent)"}` };
    }
  }

  // A body assertion on a 404 would be checking the not-found page, so the body
  // is only read when a real page was expected.
  if (spec.expect !== 404 && (spec.contains?.length || spec.absent?.length)) {
    const body = await response.text();
    for (const needle of spec.contains ?? []) {
      if (!body.includes(needle)) {
        return { label, ok: false, detail: `body is missing ${JSON.stringify(needle.slice(0, 60))}`, body };
      }
    }
    for (const needle of spec.absent ?? []) {
      if (body.includes(needle)) {
        return { label, ok: false, detail: `body unexpectedly contains ${JSON.stringify(needle.slice(0, 40))}` };
      }
    }
    return { label, ok: true, detail: `${response.status} in ${ms}ms, ${(body.length / 1024).toFixed(1)}kb` };
  }

  return { label, ok: true, detail: `${response.status} in ${ms}ms` };
}
