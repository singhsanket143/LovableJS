import { CommandExitError, FileType, Sandbox } from "e2b";
import fs from "fs/promises";
import path from "path";

import {
  findProjectById,
  updateProjectE2bSandboxId,
} from "../repository/project.repository";

export const SANDBOX_WORKDIR = "/home/user/app";
const COMPILE_SCRIPT_NAME = ".lovable-compile.mjs";
const COMPILE_SCRIPT_SOURCE_PATH = path.resolve(
  __dirname,
  "../../scripts/sandbox-compile-preview.mjs",
);

const SANDBOX_COMMAND_TIMEOUT_MS = 60_000;
const NPM_BOOTSTRAP_TIMEOUT_MS = 300_000;

export type FileCollection = Record<string, string>;

export type SandboxFileContent = {
  path: string;
  content: string;
};

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "target",
  "tmp",
  "temp",
  "cache",
  ".git",
]);
const SKIP_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);
const MAX_TRACKED_BYTE_SIZE = 1024 * 1024 * 10;

function assertProjectId(projectId: string): void {
  if (!projectId || projectId.includes("..") || path.isAbsolute(projectId)) {
    throw new Error("Invalid sandbox ID");
  }
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

  const cleaned = safeSegments.join("/");
  if (!cleaned) {
    throw new Error("Invalid file path");
  }

  return cleaned;
}

function toSandboxAbsolute(relativePath: string): string {
  const cleaned = sanitizeSandboxRelativePath(relativePath);
  const absolute = path.posix.join(SANDBOX_WORKDIR, cleaned);
  const relative = path.posix.relative(SANDBOX_WORKDIR, absolute);
  if (relative.startsWith("..") || path.posix.isAbsolute(relative)) {
    throw new Error(`Unsafe file path: ${relativePath}`);
  }
  return absolute;
}

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

async function getProjectE2bSandboxId(projectId: string): Promise<string> {
  assertProjectId(projectId);
  const project = await findProjectById(projectId);
  if (!project?.e2bSandboxId) {
    throw new Error(
      `No E2B sandbox for project ${projectId}. Run createSandbox first.`,
    );
  }
  return project.e2bSandboxId;
}

async function connectProjectSandbox(projectId: string): Promise<Sandbox> {
  const e2bSandboxId = await getProjectE2bSandboxId(projectId);
  return Sandbox.connect(e2bSandboxId);
}

async function bootstrapSandbox(sandbox: Sandbox): Promise<void> {
  await sandbox.commands.run(`mkdir -p ${SANDBOX_WORKDIR}`, {
    timeoutMs: SANDBOX_COMMAND_TIMEOUT_MS,
  });

  const compileScriptSource = await fs.readFile(
    COMPILE_SCRIPT_SOURCE_PATH,
    "utf8",
  );
  await sandbox.files.write(
    `${SANDBOX_WORKDIR}/${COMPILE_SCRIPT_NAME}`,
    compileScriptSource,
  );

  await sandbox.commands.run(
    "npm install react react-dom esbuild lucide-react --yes",
    {
      cwd: SANDBOX_WORKDIR,
      timeoutMs: NPM_BOOTSTRAP_TIMEOUT_MS,
    },
  );
}

async function ensureSandboxReady(sandbox: Sandbox): Promise<void> {
  try {
    await sandbox.files.read(`${SANDBOX_WORKDIR}/${COMPILE_SCRIPT_NAME}`);
    await sandbox.files.read(
      `${SANDBOX_WORKDIR}/node_modules/react/package.json`,
    );
  } catch {
    await bootstrapSandbox(sandbox);
  }
}

/** Creates or reconnects the E2B sandbox for a project (idempotent for Temporal retries). */
export async function provisionProjectSandbox(projectId: string): Promise<string> {
  assertProjectId(projectId);
  const project = await findProjectById(projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  if (project.e2bSandboxId) {
    const existing = await Sandbox.connect(project.e2bSandboxId);
    await ensureSandboxReady(existing);
    return projectId;
  }

  const sandbox = await Sandbox.create();
  await updateProjectE2bSandboxId(projectId, sandbox.sandboxId);
  await bootstrapSandbox(sandbox);
  return projectId;
}

export async function ensureSandbox(projectId: string): Promise<string> {
  await getProjectE2bSandboxId(projectId);
  return SANDBOX_WORKDIR;
}

export async function writeSandboxFiles(
  projectId: string,
  fileCollection: FileCollection,
): Promise<string> {
  const sandbox = await connectProjectSandbox(projectId);
  const entries = Object.entries(fileCollection).map(
    ([relativePath, content]) => ({
      path: toSandboxAbsolute(relativePath),
      data: content,
    }),
  );

  if (entries.length > 0) {
    await sandbox.files.write(entries);
  }

  return SANDBOX_WORKDIR;
}

export async function readSandboxFiles(
  projectId: string,
  relativePaths: string[],
): Promise<SandboxFileContent[]> {
  const sandbox = await connectProjectSandbox(projectId);

  return Promise.all(
    relativePaths.map(async (relativePath) => {
      const cleanedPath = sanitizeSandboxRelativePath(relativePath);
      const absolutePath = toSandboxAbsolute(relativePath);
      const content = await sandbox.files.read(absolutePath);
      return { path: cleanedPath, content };
    }),
  );
}

export async function runSandboxCommand(
  projectId: string,
  command: string,
): Promise<string> {
  try {
    const sandbox = await connectProjectSandbox(projectId);
    const result = await sandbox.commands.run(command, {
      cwd: SANDBOX_WORKDIR,
      timeoutMs: SANDBOX_COMMAND_TIMEOUT_MS,
    });
    return formatCommandSuccess(result.stdout, result.stderr);
  } catch (error) {
    if (error instanceof CommandExitError) {
      return formatCommandFailure(
        error.message,
        error.stdout,
        error.stderr,
      );
    }
    return formatCommandFailure(
      error instanceof Error ? error.message : String(error),
    );
  }
}

function toWorkdirRelative(absolutePath: string): string {
  const relative = path.posix.relative(SANDBOX_WORKDIR, absolutePath);
  return relative.split(path.sep).join("/");
}

export async function readSandboxTree(projectId: string): Promise<FileCollection> {
  const sandbox = await connectProjectSandbox(projectId);
  const files: FileCollection = {};

  const walk = async (directory: string) => {
    let entries;
    try {
      entries = await sandbox.files.list(directory);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      if (entry.type === FileType.DIR) {
        if (!SKIP_DIRS.has(entry.name)) {
          await walk(entry.path);
        }
        continue;
      }

      if (entry.type !== FileType.FILE || SKIP_FILES.has(entry.name)) {
        continue;
      }

      if (entry.size > MAX_TRACKED_BYTE_SIZE) continue;

      try {
        const relative = toWorkdirRelative(entry.path);
        if (!relative || relative.startsWith("..")) continue;
        files[relative] = await sandbox.files.read(entry.path);
      } catch {
        // skip unreadable files
      }
    }
  };

  await walk(SANDBOX_WORKDIR);
  return files;
}

export async function compileSandbox(projectId: string): Promise<string> {
  const sandbox = await connectProjectSandbox(projectId);

  try {
    const result = await sandbox.commands.run(
      `node ${COMPILE_SCRIPT_NAME}`,
      {
        cwd: SANDBOX_WORKDIR,
        timeoutMs: SANDBOX_COMMAND_TIMEOUT_MS,
      },
    );

    const html = result.stdout;
    if (!html.trim()) {
      throw new Error(
        result.stderr.trim() || "Compile produced no HTML output",
      );
    }

    return html;
  } catch (error) {
    if (error instanceof CommandExitError) {
      const detail = error.stderr.trim() || error.stdout.trim() || error.message;
      throw new Error(detail);
    }
    throw error;
  }
}

export async function compileSandboxCheck(projectId: string): Promise<string> {
  try {
    const html = await compileSandbox(projectId);
    const kilobytes = Math.round(Buffer.byteLength(html, "utf8") / 1024);
    return `SUCCESS: Preview bundle compiled (${kilobytes} KB HTML). No esbuild errors.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `COMPILE FAILED:\n${message}`;
  }
}
