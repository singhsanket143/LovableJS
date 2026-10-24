import { FileType, Sandbox } from "e2b";
import * as esbuild from "esbuild";
import fs from "fs/promises";
import path from "path";

import { sandboxRoot } from "../config/constants";
import {
  findProjectById,
  updateProjectE2bSandboxId,
} from "../repository/project.repository";

export const SANDBOX_WORKDIR = "/home/user/app"; // can bring from env vars
const COMPILE_SCRIPT_NAME = ".lovable-compile.mjs";
const COMPILE_SCRIPT_SOURCE_PATH = path.resolve(
  __dirname, "../../scripts/sandbox-compile-preview.mjs");


const serverNodeModules = path.resolve(__dirname, "../../node_modules");

const PREVIEW_ENTRY_CANDIDATES = [
  "src/App.tsx",
  "src/App.jsx",
  "app/page.tsx",
  "src/app/page.tsx",
  "App.tsx",
  "App.jsx",
  "src/main.tsx",
  "main.tsx",
] as const;

const PREVIEW_BOOTSTRAP_FILE = ".preview-bootstrap.tsx";

export type FileCollection = Record<string, string>; // relative path to the file content

export type SandboxFileContent = {
  path: string;
  content: string;
};

function assertPathInsideRoot(
  root: string,
  targetPath: string,
  errorMessage = "Invalid path",
): void {
  const relative = path.relative(root, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(errorMessage);
  }
}

function assertSandboxPathInsideRoot(sandboxPath: string): void {
  assertPathInsideRoot(sandboxRoot, sandboxPath, "Invalid sandbox ID");
}

function sanitizeSandboxRelativePath(relativePath: string): string {
  const withoutLeadingSlashes = relativePath.replace(/^[/\\]+/, "");
  const segments = withoutLeadingSlashes
    .replace(/\\/g, "/")
    .split("/")
    .filter((segment) => segment.length > 0);

  const safeSegments: string[] = [];
  for (const segment of segments) {
    if (segment === "." || segment === "..") {
      continue;
    }
    safeSegments.push(segment);
  }

  const cleaned = safeSegments.join(path.sep);
  if (!cleaned) {
    throw new Error("Invalid file path");
  }

  return cleaned;
}

export function toSandboxAbsolute(relativePath: string): string {
  const cleaned = sanitizeSandboxRelativePath(relativePath);
  const normalized = cleaned.split(path.sep).join(path.posix.sep);
  const absolute = path.posix.join(SANDBOX_WORKDIR, normalized);
  const relative = path.posix.relative(SANDBOX_WORKDIR, absolute);

  if (relative.startsWith("..") || path.posix.isAbsolute(relative)) {
    throw new Error("Invalid path");
  }

  return absolute;
}

function resolveE2bSandboxPath(relativePath: string): {
  cleanedPath: string;
  absolutePath: string;
} {
  const cleanedPath = sanitizeSandboxRelativePath(relativePath);
  return {
    cleanedPath,
    absolutePath: toSandboxAbsolute(cleanedPath),
  };
}

async function connectE2bSandbox(projectId: string): Promise<Sandbox> {
  const e2bSandboxId = await provisionProjectSandbox(projectId);
  const sandbox = await Sandbox.connect(e2bSandboxId);
  await ensureSandboxReady(sandbox);
  return sandbox;
}

export async function provisionProjectSandbox(
  projectId: string,
): Promise<string> {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.e2bSandboxId) {
    const sandbox = await Sandbox.connect(project.e2bSandboxId);
    await ensureSandboxReady(sandbox);
    return project.e2bSandboxId;
  }

  const sandbox = await Sandbox.create({
    metadata: { projectId },
  });

  const updated = await updateProjectE2bSandboxId(projectId, sandbox.sandboxId);
  if (!updated) {
    throw new Error("Project not found");
  }

  await bootstrapSandbox(sandbox);

  return sandbox.sandboxId;
}

async function ensureSandboxReady(sandbox: Sandbox): Promise<void> {
  const compileScriptPath = `${SANDBOX_WORKDIR}/${COMPILE_SCRIPT_NAME}`;
  try {
    await sandbox.files.read(compileScriptPath);
  } catch {
    await bootstrapSandbox(sandbox);
  }
}

async function runE2bSandboxCommand(
  sandbox: Sandbox,
  command: string,
  opts?: { cwd?: string; requestTimeoutMs?: number },
): Promise<void> {
  const result = await sandbox.commands.run(command, {
    cwd: opts?.cwd,
    requestTimeoutMs: opts?.requestTimeoutMs,
  });

  if (result.exitCode !== 0) {
    const detail = [result.error, result.stderr, result.stdout]
      .filter((part) => part && part.trim().length > 0)
      .join("\n");
    throw new Error(
      `Sandbox command failed (exit ${result.exitCode}): ${command}${detail ? `\n${detail}` : ""}`,
    );
  }
}

export async function bootstrapSandbox(sandbox: Sandbox): Promise<void> {
  await runE2bSandboxCommand(sandbox, `mkdir -p ${SANDBOX_WORKDIR}`);

  const compileScriptSource = await fs.readFile(
    COMPILE_SCRIPT_SOURCE_PATH,
    "utf8",
  );
  const compileScriptPath = `${SANDBOX_WORKDIR}/${COMPILE_SCRIPT_NAME}`;
  await sandbox.files.write(compileScriptPath, compileScriptSource);

  await runE2bSandboxCommand(sandbox, "npm init -y", { cwd: SANDBOX_WORKDIR });
  await runE2bSandboxCommand(
    sandbox,
    "npm install react react-dom esbuild lucide-react --yes",
    { cwd: SANDBOX_WORKDIR, requestTimeoutMs: 300_000 },
  );
}

export async function ensureSandbox(sandboxId: string): Promise<string> {
  const sandboxPath = resolveSandboxDir(sandboxId);
  await fs.mkdir(sandboxPath, { recursive: true });
  return sandboxPath;
}

export async function writeSandboxFiles(
  sandboxId: string,
  fileCollection: FileCollection,
): Promise<string> {
  const sandbox = await connectE2bSandbox(sandboxId);

  await Promise.all(
    Object.entries(fileCollection).map(async ([relativePath, content]) => {
      const { absolutePath } = resolveE2bSandboxPath(relativePath);
      const parentDir = path.posix.dirname(absolutePath);
      await runE2bSandboxCommand(
        sandbox,
        `mkdir -p ${JSON.stringify(parentDir)}`,
      );
      await sandbox.files.write(absolutePath, content);
    }),
  );

  return SANDBOX_WORKDIR;
}

function resolveSandboxDir(sandboxId: string): string {
  if (!sandboxId || sandboxId.includes("..") || path.isAbsolute(sandboxId)) {
    throw new Error("Invalid sandbox ID");
  }

  const sandboxDir = path.resolve(sandboxRoot, sandboxId);
  assertSandboxPathInsideRoot(sandboxDir);
  return sandboxDir;
}

function resolveSandboxFilePath(
  sandboxDir: string,
  relativePath: string,
): { cleanedPath: string; filePath: string } {
  const cleanedPath = sanitizeSandboxRelativePath(relativePath);
  const filePath = path.resolve(sandboxDir, cleanedPath);
  assertPathInsideRoot(sandboxDir, filePath, `Unsafe file path: ${relativePath}`);
  return { cleanedPath, filePath };
}

export async function readSandboxFiles(
  sandboxId: string,
  relativePaths: string[],
): Promise<SandboxFileContent[]> {
  const sandbox = await connectE2bSandbox(sandboxId);

  return Promise.all(
    relativePaths.map(async (relativePath) => {
      const { cleanedPath, absolutePath } = resolveE2bSandboxPath(relativePath);
      const content = await sandbox.files.read(absolutePath);
      return { path: cleanedPath, content };
    }),
  );
}

const SANDBOX_COMMAND_TIMEOUT_MS = 60_000;

function formatCommandSuccess(stdout: string, stderr: string): string {
  const trimmedStdout = stdout.trim();
  const trimmedStderr = stderr.trim();
  if (trimmedStdout) return trimmedStdout;
  if (trimmedStderr) return trimmedStderr;
  return "no output";
}

function formatCommandFailure(
  message: string,
  stdout = "",
  stderr = "",
): string {
  const parts = [`Error: ${message}`];
  const trimmedStdout = stdout.trim();
  const trimmedStderr = stderr.trim();
  if (trimmedStdout) parts.push(`stdout:\n${trimmedStdout}`);
  if (trimmedStderr) parts.push(`stderr:\n${trimmedStderr}`);
  return parts.join("\n\n");
}

export async function runSandboxCommand(
  sandboxId: string,
  command: string,
): Promise<string> {
  try {
    const sandbox = await connectE2bSandbox(sandboxId);
    const result = await sandbox.commands.run(command, {
      cwd: SANDBOX_WORKDIR,
      requestTimeoutMs: SANDBOX_COMMAND_TIMEOUT_MS,
    });

    if (result.exitCode !== 0) {
      return formatCommandFailure(
        result.error ?? `Command exited with code ${result.exitCode}`,
        result.stdout,
        result.stderr,
      );
    }

    return formatCommandSuccess(result.stdout, result.stderr);
  } catch (error) {
    return formatCommandFailure(
      error instanceof Error ? error.message : String(error),
    );
  }
}

const SKIP_DIRS = new Set(["node_modules", "dist", "build", "out", "target", "tmp", "temp", "cache", ".git"]);
const SKIP_FILES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);
const MAX_TRACKED_BYTE_SIZE = 1024 * 1024 * 10; // 10MB

export async function readSandboxTree(sandboxId: string): Promise<FileCollection> {
  const sandbox = await connectE2bSandbox(sandboxId);
  const files: FileCollection = {};

  const walk = async (currentDir: string): Promise<void> => {
    let entries;
    try {
      entries = await sandbox.files.list(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      const absolutePath = path.posix.join(currentDir, entry.name);

      if (entry.type === FileType.DIR) {
        if (!SKIP_DIRS.has(entry.name)) {
          await walk(absolutePath);
        }
        continue;
      }

      if (entry.type !== FileType.FILE || SKIP_FILES.has(entry.name)) {
        continue;
      }

      if (entry.size > MAX_TRACKED_BYTE_SIZE) continue;

      try {
        const relativePath = path.posix.relative(SANDBOX_WORKDIR, absolutePath);
        if (!relativePath || relativePath.startsWith("..")) continue;

        const content = await sandbox.files.read(absolutePath);
        files[relativePath] = content;
      } catch {
        // skip unreadable or binary files
      }
    }
  };

  await walk(SANDBOX_WORKDIR);
  return files;
}

async function findSandboxAppEntry(sandboxDir: string): Promise<string> {
  for (const candidate of PREVIEW_ENTRY_CANDIDATES) {
    try {
      await fs.access(path.join(sandboxDir, candidate));
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(
    `No preview entry found in sandbox. Tried: ${PREVIEW_ENTRY_CANDIDATES.join(", ")}`,
  );
}

function previewBootstrapSource(appEntryRelative: string): string {
  const importPath = `./${appEntryRelative.replace(/\\/g, "/")}`;
  return `import React from "react";
import { createRoot } from "react-dom/client";
import App from ${JSON.stringify(importPath)};

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(React.createElement(App));
}
`;
}

function previewHtmlDocument(script: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Sandbox preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script>${script}</script>
  </body>
</html>
`;
}

export async function compileSandbox(sandboxId: string): Promise<string> {
  const sandboxDir = resolveSandboxDir(sandboxId);
  await fs.mkdir(sandboxDir, { recursive: true });

  const appEntry = await findSandboxAppEntry(sandboxDir);
  const bootstrapPath = path.join(sandboxDir, PREVIEW_BOOTSTRAP_FILE);
  const bootstrapSource = previewBootstrapSource(appEntry);

  await fs.writeFile(bootstrapPath, bootstrapSource, "utf8");

  try {
    const result = await esbuild.build({
      absWorkingDir: sandboxDir,
      entryPoints: [bootstrapPath],
      bundle: true,
      format: "iife",
      platform: "browser",
      target: ["es2020"],
      jsx: "automatic",
      jsxImportSource: "react",
      loader: {
        ".tsx": "tsx",
        ".ts": "ts",
        ".jsx": "jsx",
        ".js": "js",
      },
      nodePaths: [serverNodeModules],
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
      write: false,
      logLevel: "silent",
    });

    const output = result.outputFiles?.[0]?.text;
    if (!output) {
      throw new Error("esbuild produced no output");
    }

    return previewHtmlDocument(output);
  } finally {
    await fs.unlink(bootstrapPath).catch(() => undefined);
  }
}

function formatCompileError(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const failures = (error as esbuild.BuildFailure).errors;
    if (failures.length > 0) {
      return failures
        .map((item) => {
          const location = item.location;
          const where = location
            ? `${location.file}:${location.line}:${location.column}`
            : "bundle";
          return `${where}: ${item.text}`;
        })
        .join("\n");
    }
  }

  return error instanceof Error ? error.message : String(error);
}

/** Same as preview compile; returns a short agent-facing status string (not HTML). */
export async function compileSandboxCheck(sandboxId: string): Promise<string> {
  try {
    const html = await compileSandbox(sandboxId);
    const kilobytes = Math.round(Buffer.byteLength(html, "utf8") / 1024);
    return `SUCCESS: Preview bundle compiled (${kilobytes} KB HTML). No esbuild errors.`;
  } catch (error) {
    return `COMPILE FAILED:\n${formatCompileError(error)}`;
  }
}


