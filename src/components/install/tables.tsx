/**
 * The small tables on the install page.
 *
 * Separate from the page because they are data with a shape, and a page that
 * reads as prose makes both worse: harder to check against the toolchain, and
 * harder to keep true.
 */

/** What has to be on the machine before `hard build` can work. */
export function PrerequisiteTable() {
  const rows: [string, string, string][] = [
    ["Rust", "1.75 or newer", "Only to build from source. A release binary does not need it."],
    ["C++ compiler", "g++ 13+ or clang++ 17+", "Required always: HardScript links with it, so a binary alone is not enough."],
    ["make", "any version", "Used by the emitted build."],
    ["git", "any version", "Only for the registry and for cloning the compiler."],
    ["PostgreSQL client libraries", "libpq headers", "Only for programs that `bring postgres`."],
  ];
  return (
    <div className="mt-10 overflow-x-auto rounded-lg border border-[var(--line)]">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr>
            {["What", "Version", "When you need it"].map((h) => (
              <th
                key={h}
                className="border-b border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-left text-[13px] font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <td className="border-b border-[var(--line)] px-3.5 py-2.5 font-medium">{r[0]}</td>
              <td className="border-b border-[var(--line)] px-3.5 py-2.5 font-mono text-[13px] text-[var(--ink-muted)]">
                {r[1]}
              </td>
              <td className="border-b border-[var(--line)] px-3.5 py-2.5 text-[var(--ink-muted)] last:border-0">
                {r[2]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UpdateTable() {
  const rows: [string, string][] = [
    ["From a source build", "cd into the clone and `git pull`, then `cargo install --path cli --locked` again. The binary lands in the same place, so nothing else changes."],
    ["From a release binary", "Download the new asset over the old one and run `hard doctor`. Compare the runtime commit before and after, since a bug can live on either side."],
    ["Project dependencies", "`hard update` moves the lockfile to the newest matching release, and `hard outdated` shows what would move. Commit the lockfile."],
    ["Before any of the above", "`hard cache clean` is not required and is usually wrong: a stale cache entry is a real problem, a warm one is free speed."],
  ];
  return (
    <div className="mt-4 space-y-2">
      {rows.map(([k, v]) => (
        <div
          key={k}
          className="grid gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4"
        >
          <p className="text-[13.5px] font-medium">{k}</p>
          <p className="text-[14px] leading-[1.7] text-[var(--ink-muted)]">{v}</p>
        </div>
      ))}
    </div>
  );
}

export function UninstallTable() {
  const rows: [string, string][] = [
    ["The binary", "`cargo uninstall hard` after a source build, or delete the file a release install put on your PATH."],
    ["The package cache", "`hard cache clean` empties ~/.hard/cache. It is content-addressed, so deleting it costs a download per package on the next install."],
    ["A project", "A project is a directory. Delete it. Add `.hard/` to `.gitignore` before you commit anything, because `hard new` does that for you and a hand-rolled project may not."],
    ["The compiler clone", "`rm -rf hardscript-1` — and remember `cargo install` copied the binary out, so removing the clone does not remove the toolchain."],
  ];
  return (
    <div className="mt-4 space-y-2">
      {rows.map(([k, v]) => (
        <div
          key={k}
          className="grid gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4"
        >
          <p className="text-[13.5px] font-medium">{k}</p>
          <p className="text-[14px] leading-[1.7] text-[var(--ink-muted)]">{v}</p>
        </div>
      ))}
    </div>
  );
}
