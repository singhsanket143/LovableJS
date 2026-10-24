import * as esbuild from "esbuild";
import fs from "fs/promises";
import path from "path";

const PREVIEW_ENTRY_CANDIDATES = [
  "src/App.tsx",
  "src/App.jsx",
  "app/page.tsx",
  "src/app/page.tsx",
  "App.tsx",
  "App.jsx",
  "src/main.tsx",
  "main.tsx",
];

const PREVIEW_BOOTSTRAP_FILE = ".preview-bootstrap.tsx";

function previewBootstrapSource(appEntryRelative) {
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

function previewHtmlDocument(script) {
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

function formatCompileError(error) {
  if (error && typeof error === "object" && "errors" in error) {
    const failures = error.errors;
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

async function findAppEntry(workdir) {
  for (const candidate of PREVIEW_ENTRY_CANDIDATES) {
    try {
      await fs.access(path.join(workdir, candidate));
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error(
    `No preview entry found in sandbox. Tried: ${PREVIEW_ENTRY_CANDIDATES.join(", ")}`,
  );
}

const workdir = process.cwd();
const bootstrapPath = path.join(workdir, PREVIEW_BOOTSTRAP_FILE);

try {
  const appEntry = await findAppEntry(workdir);
  await fs.writeFile(bootstrapPath, previewBootstrapSource(appEntry), "utf8");

  const result = await esbuild.build({
    absWorkingDir: workdir,
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

  process.stdout.write(previewHtmlDocument(output));
} catch (error) {
  process.stderr.write(formatCompileError(error));
  process.exitCode = 1;
} finally {
  await fs.unlink(bootstrapPath).catch(() => undefined);
}
