import { Client, Connection } from "@temporalio/client";

import { env } from "../config/env";
import { retryWithExponentialBackoff } from "../utils/retry";
import { pingWorkflow } from "./workflows";

export async function connect(): Promise<Client> {
  return retryWithExponentialBackoff(async () => {
    const connection = await Connection.connect({
      address: env.TEMPORAL_ADDRESS,
    });

    return new Client({
      connection,
      namespace: env.TEMPORAL_NAMESPACE,
    });
  }, { label: "Temporal client connect" });
}

export async function startPing(name: string): Promise<string> {
  const client = await connect();

  const handle = await client.workflow.start(pingWorkflow, {
    taskQueue: env.TEMPORAL_TASK_QUEUE,
    workflowId: `ping-${Date.now()}`,
    args: [name],
  });

  return handle.result();
}

async function main(): Promise<void> {
  const name = process.argv[2] ?? "Temporal";
  const result = await startPing(name);
  console.log(`pingWorkflow result: ${result}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Temporal client failed:", error);
    process.exit(1);
  });
}
