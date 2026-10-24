import { tool } from "langchain";
import { z } from "zod";
import { readSandboxFiles } from "../../lib/sandbox";

export function createReviewerTools(sandboxId: string) {
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

    return {
        readFilesTool,
        tools: [readFilesTool],
    };
}
