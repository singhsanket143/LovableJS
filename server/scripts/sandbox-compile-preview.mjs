import esbuild from "esbuild";
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
const PREVIEW_OUTPUT_HTML = ".preview-output.html";

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
  if (error && typeof error === "object" && Array.isArray(error.errors)) {
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

async function findSandboxAppEntry(workdir) {
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

async function compilePreview(workdir) {
  const appEntry = await findSandboxAppEntry(workdir);
  const bootstrapPath = path.join(workdir, PREVIEW_BOOTSTRAP_FILE);
  const bootstrapSource = previewBootstrapSource(appEntry);

  await fs.writeFile(bootstrapPath, bootstrapSource, "utf8");

  try {
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
      nodePaths: [path.join(workdir, "node_modules")],
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

    const html = previewHtmlDocument(output);
    await fs.writeFile(
      path.join(workdir, PREVIEW_OUTPUT_HTML),
      html,
      "utf8",
    );
    return html;
  } finally {
    await fs.unlink(bootstrapPath).catch(() => undefined);
  }
}

const checkMode = process.argv.includes("--check");
const workdir = process.cwd();

try {
  const html = await compilePreview(workdir);
  if (checkMode) {
    const kilobytes = Math.round(Buffer.byteLength(html, "utf8") / 1024);
    console.log(
      `SUCCESS: Preview bundle compiled (${kilobytes} KB HTML). No esbuild errors.`,
    );
    process.exit(0);
  }
  process.exit(0);
} catch (error) {
  const message = formatCompileError(error);
  if (checkMode) {
    console.log(`COMPILE FAILED:\n${message}`);
    process.exit(0);
  }
  console.error(message);
  process.exit(1);
}
