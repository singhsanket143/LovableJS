# Ensure sandbox folder function
_Exported on 03/10/2026 at 16:40:42 BST from Cursor (3.22.12)_

---

**User**

lets write a function ensureSandbox , it will take a sandboxid, it creates the sandbox folder if it doesnot exist yet and return its absolute path. the path should be checked inside the sandboxRoot exported from @server/src/config/constants.ts 

---

**Cursor**

Reviewing constants and the sandbox module to implement `ensureSandbox`.




Implementing `ensureSandbox` with path containment checks under `sandboxRoot`, matching project import conventions.




`ensureSandbox` is in `server/src/lib/sandbox.ts`. It:

1. Builds `path.resolve(sandboxRoot, sandboxId)` using `sandboxRoot` from `../config/constants`
2. Ensures the resolved path stays under `sandboxRoot` (rejects `..` and absolute IDs)
3. Creates the directory with `fs.mkdir(..., { recursive: true })` if needed
4. Returns the absolute sandbox path

```1:28:server/src/lib/sandbox.ts
import fs from "fs/promises";
import path from "path";

import { sandboxRoot } from "../config/constants";

export type FileCollection = Record<string, string>; // relative path to the file content

function assertSandboxPathInsideRoot(sandboxPath: string): void {
  const relative = path.relative(sandboxRoot, sandboxPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid sandbox ID");
  }
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
```

Example: `ensureSandbox("clxyz123")` → `/…/LovableJS/data/sandbox/clxyz123` (exact prefix depends on where the server is built/run from).

---

**User**

lets write one more function 'writeSandboxFiles' which will take a sandboxId, and fileCollection of type FileCollection, and first it will ensureSandbox , then  go to each entry of the fileCollection and 

1. first evaluate whether the path of the file is a safe path, for this we can strip any leading '/' and delete any '..' segments that can lead this file writing to go outside of the sandbox. 

2. once evaluated that the path is safe, we will join the cleaned path onto the sandbox directory.

3. Create parent folders and write the file in URF-8 format. 

at last return the sandbox directory so that caller knows where the files landed. 

---

**Cursor**

Implementing path sanitization and `writeSandboxFiles`, reusing a shared helper to verify paths stay within the sandbox directory.




`writeSandboxFiles` is in `server/src/lib/sandbox.ts`. Flow:

1. **`ensureSandbox(sandboxId)`** — creates the sandbox dir if needed.
2. **Per `FileCollection` entry** — `sanitizeSandboxRelativePath` strips leading `/` or `\`, normalizes separators, and drops `.` and `..` segments (no parent traversal).
3. **Join + verify** — `path.resolve(sandboxDir, cleanedPath)` and `assertPathInsideRoot` so nothing escapes the sandbox folder.
4. **Write** — `mkdir` on the parent dir, then `writeFile(..., "utf8")`.
5. **Return** — the sandbox directory absolute path.

```59:77:server/src/lib/sandbox.ts
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
```

Examples: `/src/index.ts` → `src/index.ts`; `foo/../../etc/passwd` → `foo/etc/passwd` (both `..` dropped). Empty paths after sanitization throw `Invalid file path`.

---

**User**

can u show examples of sanitizeSandboxRelativePath function

---

**Cursor**

Here’s how `sanitizeSandboxRelativePath` behaves (on your machine, segments are joined with `/`):

### Normal paths

| Input | Output |
|--------|--------|
| `index.html` | `index.html` |
| `src/App.tsx` | `src/App.tsx` |
| `/src/App.tsx` | `src/App.tsx` (leading `/` removed) |
| `\src\App.tsx` | `src/App.tsx` (leading `\` removed, `\` → `/`) |
| `src//utils//helper.ts` | `src/utils/helper.ts` (empty segments dropped) |

### `.` and `..` (dropped, not resolved)

| Input | Output | Note |
|--------|--------|------|
| `./src/index.ts` | `src/index.ts` | `.` skipped |
| `src/./index.ts` | `src/index.ts` | |
| `../secret.txt` | `secret.txt` | `..` removed, not “go up” |
| `src/../../etc/passwd` | `src/etc/passwd` | both `..` removed |
| `foo/..` | `foo` | trailing `..` dropped |

So `foo/../../outside/file.ts` does **not** mean “escape to `outside/`”. It becomes `foo/outside/file.ts` inside the sandbox.

### Invalid

| Input | Result |
|--------|--------|
| `` | throws `Invalid file path` |
| `/` | throws `Invalid file path` |
| `..` | throws `Invalid file path` |
| `./../` | throws `Invalid file path` |
| `...` | `...` (three dots is a normal segment name) |

### Mental model

1. Strip leading `/` or `\`.
2. Split on `/` (after normalizing `\` to `/`).
3. Keep only non-empty segments that are not `.` or `..`.
4. Join with the OS separator — if nothing is left, throw.

After this, `writeSandboxFiles` still runs `assertPathInsideRoot(sandboxDir, filePath)` so the final resolved path cannot leave that sandbox directory.

---

**User**

lets write one more function 'readSandboxFiles' this will read a specific list of files not the whole tree. make sure we do path cleaning just like with writeSandboxFiles . the function returns a contents array which will be having each entry as the path and content of the files passed.

---

**Cursor**

Adding `readSandboxFiles` with the same path sanitization as `writeSandboxFiles`, and a small return type for path + content entries.




`readSandboxFiles` is added, and path resolution is shared with `writeSandboxFiles` via `resolveSandboxFilePath`.

**Signature**

```typescript
readSandboxFiles(sandboxId: string, relativePaths: string[]): Promise<SandboxFileContent[]>
```

Each item is `{ path, content }`. `path` is the **sanitized** sandbox-relative path (same rules as writes), so it matches keys you’d use in `FileCollection`.

**Example**

```typescript
const files = await readSandboxFiles("my-sandbox-id", [
  "/src/App.tsx",
  "src/../src/utils.ts",
]);

// [
//   { path: "src/App.tsx", content: "..." },
//   { path: "src/utils.ts", content: "..." },
// ]
```

**Behavior**

- Validates `sandboxId` and resolves the sandbox dir (does **not** create it — missing sandbox or file surfaces as a normal `readFile` error).
- Sanitizes each path with `sanitizeSandboxRelativePath`, then checks it stays inside the sandbox with `assertPathInsideRoot`.
- Reads as UTF-8; result order matches the input `relativePaths` array.

`ensureSandbox` / `writeSandboxFiles` now use the same helpers so read and write path handling stay aligned.

---

**User**

write a new function 'runSandboxCommand' which runs a shell comamnd with the sandbox folder as the working directory. Make sure ensureSandbox so current working directory exists. We can promisify the exec utilitiy and put a 60 section timeout with 1MB output cap. on success return stdout, or etderr if stdout is empty. if no output then say "no output" . On failure, return a string that includes the error message, srtdout and stderr. if should not throw . Because we want our agent to see the failure and text and act accordingly. 

---

**Cursor**

Implementing `runSandboxCommand` with promisified `exec`, timeout and buffer limits, and always returning a string (never throwing).




`runSandboxCommand` is in `server/src/lib/sandbox.ts`.

**Behavior**

- Calls `ensureSandbox(sandboxId)` so the cwd exists.
- Runs the command via promisified `exec` with `cwd` set to that sandbox directory.
- **Timeout:** 60 seconds.
- **Output cap:** 1MB (`maxBuffer`).
- **Never throws** — always returns a string for the agent.

**Return values**

| Case | Returned string |
|------|------------------|
| Success, non-empty stdout | trimmed stdout |
| Success, empty stdout, non-empty stderr | trimmed stderr |
| Success, both empty | `"no output"` |
| Failure (non-zero exit, timeout, buffer exceeded, invalid sandbox, etc.) | `Error: …` plus `stdout:` / `stderr:` sections when present |

**Example**

```typescript
const out = await runSandboxCommand("my-sandbox", "npm install");
// success → install logs, or "no output"

const failed = await runSandboxCommand("my-sandbox", "npm run build");
// failure → "Error: Command failed: ...\n\nstdout:\n...\n\nstderr:\n..."
```

