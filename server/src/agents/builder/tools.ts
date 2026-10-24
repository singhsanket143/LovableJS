import { tool } from "langchain";
import { z } from "zod";
import {
    FileCollection,
    readSandboxFiles,
    runSandboxCommand,
    writeSandboxFiles,
} from "../../lib/sandbox";

const sandboxFileSchema = z.object({
    path: z
        .string()
        .min(1)
        .describe('Sandbox-relative path (e.g. "src/App.tsx").'),
    content: z.string().describe("Full file contents to write."),
});


export function createBuilderTools(
    sandboxId: string,
    files: FileCollection,
    onWrite: () => void
) {
    const terminalTool = tool(
        async ({ command }) => runSandboxCommand(sandboxId, command),
        {
            name: "terminal",
            description: 'Run a shell command in the sandbox. Use "npm install <package> --yes" for package installation.',
            schema: z.object({
                command: z.string().describe("The command to run in the sandbox."),
            }),
        }
    );

    const readFilesTool = tool(
        async ({ paths }) => {
            try {
                const files = await readSandboxFiles(sandboxId, paths);
                return files
                    .map(
                        ({ path: filePath, content }) =>
                            `=== ${filePath} ===\n${content}`,
                    )
                    .join("\n\n");
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                return `Error reading files: ${message}`;
            }
        },
        {
            name: "readFiles",
            description:
                "Read one or more files from the sandbox by relative path (e.g. src/App.tsx).",
            schema: z.object({
                paths: z
                    .array(z.string().min(1))
                    .min(1)
                    .describe("Sandbox-relative file paths to read."),
            }),
        },
    );

    const createOrUpdateFilesTool = tool(
        async ({ files: updates }) => {
            try {
                const batch: FileCollection = {};
                for (const { path: filePath, content } of updates) {
                    batch[filePath] = content;
                    files[filePath] = content;
                }
                await writeSandboxFiles(sandboxId, batch);
                onWrite();
                const paths = updates.map(({ path: filePath }) => filePath);
                return `Wrote ${paths.length} file(s): ${paths.join(", ")}`;
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                return `Error writing files: ${message}`;
            }
        },
        {
            name: "createOrUpdateFiles",
            description:
                "Create or overwrite one or more files in the sandbox. Paths must be relative to the project root.",
            schema: z.object({
                files: z
                    .array(sandboxFileSchema)
                    .min(1)
                    .describe("Files to create or update."),
            }),
        },
    );

    return {
        terminalTool,
        readFilesTool,
        createOrUpdateFilesTool,
        tools: [terminalTool, readFilesTool, createOrUpdateFilesTool],
    };

}

