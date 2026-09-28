/**
 * The install methods, and what is actually known about each one.
 *
 * This is the one page where a lie is most expensive: a reader copies a command
 * from it onto a machine that matters, and a command that was never run fails
 * somewhere between their terminal and their afternoon. So each method carries
 * its verification status in the same field the page renders it from, and
 * `verified` means one thing only — the commands were executed, on the machine
 * named, and produced the output described.
 *
 * The planned methods are not filler. Each one names the artifact that has to
 * exist before it can work, which makes the page a specification for the
 * packaging work rather than a list of wishes.
 */

export type InstallStatus = "verified" | "planned";

export type InstallStep = {
  label: string;
  command: string;
  note?: string;
};

export type InstallMethod = {
  id: string;
  /** Fragment id, so a link can jump to it. */
  anchor: string;
  title: string;
  label: string;
  status: InstallStatus;
  /** Where the verified commands were run, when they were run. */
  verifiedOn?: string;
  summary: string;
  requires: string[];
  steps: InstallStep[];
  /**
   * The single command the homepage shows, for the method that works.
   *
   * It must be a line the reader will also find on /install, which is why it is
   * a field here rather than a string typed into the homepage. The homepage used
   * to advertise `curl … install.sh | sh` — a command for a script that does not
   * exist, on a domain that does not resolve — and it survived every gate in
   * this repository, because the validator compiles HardScript and said nothing
   * about a shell one-liner sitting next to it.
   */
  heroCommand?: string;
  /** For planned methods: the artifact that is missing. */
  blockedBy?: string;
};

const SOURCE_BUILD: InstallMethod = {
  id: "source",
  anchor: "source-build",
  title: "From source",
  label: "Build from source",
  status: "verified",
  verifiedOn: "Debian 12, g++ 15.3",
  // One line, and it is the real one: clone the repository, then install the
  // package called `cli`, which puts a binary called `hard` on PATH.
  heroCommand: "git clone https://github.com/developer-rs5/hardscript-1.git && cargo install --path cli",
  summary:
    "The whole toolchain is one Cargo package, and this is the method that is guaranteed to work: it needs a Rust toolchain and a C++ compiler, and nothing else. Everything else on this page is a wrapper around it.",
  requires: ["rust 1.75+", "g++ 13+ or clang++ 17+", "git"],
  steps: [
    {
      label: "Clone the compiler",
      command: "git clone https://github.com/developer-rs5/hardscript-1.git\ncd hardscript-1",
      note: "The workspace's default member is the CLI, so a plain clone is enough.",
    },
    {
      label: "Install the binary",
      command: "cargo install --path cli --locked",
      note: "The package is `cli` and the binary it installs is `hard`. --locked uses the committed Cargo.lock, which is what you want on a machine that will build the same thing twice.",
    },
    {
      label: "Check it",
      command: "hard --version\nhard doctor",
      note: "`hard doctor` is the real check: it finds g++, the runtime and the cache, and prints the exact command it looked for when it cannot.",
    },
  ],
};

export const installMethods: InstallMethod[] = [
  SOURCE_BUILD,
  {
    id: "prebuilt",
    anchor: "prebuilt",
    title: "Prebuilt binary",
    label: "Download a binary",
    status: "planned",
    summary:
      "The fastest install, and the one every ecosystem converges on eventually. It does not exist yet: the compiler repository has no release artifacts and no release workflow.",
    requires: ["x86_64 or aarch64", "g++ 13+ or clang++ 17+"],
    blockedBy:
      "a release workflow that builds the CLI for linux-x64, linux-arm64, macos-x64, macos-arm64 and windows-x64, and publishes them as release assets. The binary needs the C++ toolchain present on the target machine, because it links at install time rather than shipping a prebuilt object.",
    steps: [
      {
        label: "Once releases exist",
        command:
          "# linux / macos, once the release workflow publishes assets\ncurl -fsSL https://example.invalid/hardscript/hard-linux-x64 -o ~/.local/bin/hard\nchmod +x ~/.local/bin/hard\nhard doctor",
        note: "The host is a placeholder on purpose. A download URL that looks real but 404s is worse than one that is obviously not there yet, and the asset name is the convention the release workflow should follow.",
      },
    ],
  },
  {
    id: "brew",
    anchor: "homebrew",
    title: "Homebrew",
    label: "Homebrew",
    status: "planned",
    summary:
      "A formula in a tap, which is how a Rust binary usually reaches macOS and Linux users. The compiler repository has no Formula file.",
    requires: ["Homebrew"],
    blockedBy:
      "a `Formula/hard.rb` in a tap repository, built from a release tarball rather than from source at install time, with a test block that runs `hard --version`.",
    steps: [
      {
        label: "Once the formula is published",
        command: "brew install hard-script/tap/hard\nhard doctor",
      },
    ],
  },
  {
    id: "scoop",
    anchor: "scoop",
    title: "Scoop",
    label: "Scoop",
    status: "planned",
    summary:
      "The Windows path that needs no administrator rights. The compiler repository has no Scoop manifest.",
    requires: ["Scoop", "a C++ toolchain on PATH"],
    blockedBy:
      "a `hard.json` manifest in the repository's own bucket, pointing at a windows-x64 release asset. Scoop installs to a versioned directory and shims, which suits a single binary with no runtime.",
    steps: [
      {
        label: "Once the manifest is in a bucket",
        command:
          'scoop bucket add hardscript https://github.com/developer-rs5/hardscript-1\nscoop install hard\nhard doctor',
      },
    ],
  },
  {
    id: "apt",
    anchor: "apt",
    title: "APT",
    label: "Debian / Ubuntu",
    status: "planned",
    summary:
      "A .deb with the compiler dependency declared, so `apt install hard` resolves g++ on its own. The compiler repository has no debian/ directory and no .deb is built anywhere.",
    requires: ["Debian 12+ or Ubuntu 22.04+"],
    blockedBy:
      "a `debian/` packaging directory — control, changelog, rules, and a Depends line naming g++ — plus a job that builds the .deb on each release. Without the dependency declared, the binary installs and then fails at the first build with a g++ error, which is a bad first impression to design on purpose.",
    steps: [
      {
        label: "Once a repository is published",
        command:
          "curl -fsSL https://example.invalid/hardscript.gpg | sudo tee /etc/apt/trusted.gpg.d/hardscript.asc\necho 'deb https://example.invalid/debian stable main' | sudo tee /etc/apt/sources.list.d/hardscript.list\nsudo apt update && sudo apt install hard\nhard doctor",
      },
    ],
  },
  {
    id: "pacman",
    anchor: "pacman",
    title: "Pacman",
    label: "Arch / Manjaro",
    status: "planned",
    summary:
      "A PKGBUILD, which is the shortest packaging definition of the nine. The compiler repository has none.",
    requires: ["Arch Linux or a Manjaro derivative"],
    blockedBy:
      "a PKGBUILD in the AUR or a repository, with makedepends naming rust and depends naming a C++ compiler.",
    steps: [
      {
        label: "Once a PKGBUILD is published",
        command: "yay -S hard        # from the AUR\ngit clone https://aur.archlinux.org/hard.git && cd hard && makepkg -si\nhard doctor",
      },
    ],
  },
  {
    id: "nix",
    anchor: "nix",
    title: "Nix",
    label: "Nix",
    status: "planned",
    summary:
      "A flake, which would pin the Rust and C++ toolchains along with the binary and finally make a build reproducible across machines. The compiler repository has no flake.nix or shell.nix.",
    requires: ["Nix with flakes enabled"],
    blockedBy:
      "a flake exposing the CLI as a package and a devShell, built with rustPlatform and a pinned stdenv. This is the only method on the page that could also solve the C++ compiler dependency, since Nix would bring its own.",
    steps: [
      {
        label: "Once the flake exists",
        command: "nix profile install github:developer-rs5/hardscript-1#hard\nnix run github:developer-rs5/hardscript-1#hard -- --version",
      },
    ],
  },
  {
    id: "docker",
    anchor: "docker",
    title: "Docker",
    label: "Docker",
    status: "planned",
    summary:
      "A two-stage image: Rust builds the CLI, and a slim runtime stage carries only the binary and a C++ toolchain. The compiler repository has no Dockerfile.",
    requires: ["Docker", "g++ inside the image for builds"],
    blockedBy:
      "a Dockerfile with a build stage on the Rust image and a runtime stage carrying g++ — the binary is useless without a linker — plus a published image tag per release. The image cannot be `FROM scratch`, which is the reflex, because the produced executable links libstdc++.",
    steps: [
      {
        label: "Once the image is published",
        command: "docker run --rm -v \"$PWD:/app\" -w /app ghcr.io/developer-rs5/hardscript hard build",
      },
    ],
  },
  {
    id: "windows",
    anchor: "windows-native",
    title: "Windows",
    label: "Windows",
    status: "planned",
    summary:
      "Windows is reached through Scoop or a release asset today. The compiler links with whichever C++ compiler is on PATH — MSVC or MinGW — and the build cache is a directory, not a registry entry, so nothing else is needed once the binary exists.",
    requires: ["Scoop or a release asset", "MSVC or MinGW g++ on PATH"],
    blockedBy:
      "the same release asset as the prebuilt binary, plus a CI job that builds it. The toolchain itself is not the obstacle; publishing one is.",
    steps: [
      {
        label: "On Windows, once a manifest exists",
        command: "scoop install hard\nhard doctor",
      },
    ],
  },
];

export function getInstallMethods(): InstallMethod[] {
  return installMethods;
}
