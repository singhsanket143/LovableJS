import fs from "fs/promises";
import path from "path";

import { sandboxRoot } from "../config/constants";

export type FileCollection = Record<string, string>; // relative path to the file content

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

export async function ensureSandbox(sandboxId: string): Promise<string> {
  if (!sandboxId || sandboxId.includes("..") || path.isAbsolute(sandboxId)) {
    throw new Error("Invalid sandbox ID");
  }

  const sandboxPath = path.resolve(sandboxRoot, sandboxId);
  assertSandboxPathInsideRoot(sandboxPath);

  await fs.mkdir(sandboxPath, { recursive: true });

  return sandboxPath;
}

export async function writeSandboxFiles(
  sandboxId: string,
  fileCollection: FileCollection,
): Promise<string> {
  const sandboxDir = await ensureSandbox(sandboxId);

  await Promise.all(
    Object.entries(fileCollection).map(async ([relativePath, content]) => {
      const cleanedPath = sanitizeSandboxRelativePath(relativePath);
      const filePath = path.resolve(sandboxDir, cleanedPath);
      assertPathInsideRoot(sandboxDir, filePath, `Unsafe file path: ${relativePath}`);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf8");
    }),
  );

  return sandboxDir;
}


const SKIP_DIRS = new Set(["node_modules", "dist", "build", "out", "target", "tmp", "temp", "cache", ".git"]);
const SKIP_FILES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);
const MAX_TRACKED_BYTE_SIZE = 1024 * 1024 * 10; // 10MB

export async function readSandboxTree(sandboxId: string): Promise<FileCollection> {
    const root = path.join(sandboxRoot, sandboxId);
    assertSandboxPathInsideRoot(root);

    const files: FileCollection = {};

    const walk = async (current: string) => {
        let entries = [];

        try {
            entries = await fs.readdir(current, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            if (entry.name.startsWith(".")) continue;
            const fullPath = path.join(current, entry.name);
            if(entry.isDirectory()) {
                if(!SKIP_DIRS.has(entry.name)) await walk(fullPath);
                continue;
            }
            if(!entry.isFile() || SKIP_FILES.has(entry.name)) continue;

            try {
                const stat = await fs.stat(fullPath); // stat or metadata of the file  
                if(stat.size > MAX_TRACKED_BYTE_SIZE) continue;

                files[path.relative(root, fullPath)] = await fs.readFile(fullPath, "utf8");
            } catch {

            }

        }

    }

    await walk(root);


    return files;
}