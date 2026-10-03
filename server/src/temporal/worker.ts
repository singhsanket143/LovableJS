import { NativeConnection, Worker } from "@temporalio/worker";

import { env } from "../config/env";
import { retryWithExponentialBackoff } from "../utils/retry";

export async function connect(): Promise<NativeConnection> {
  return retryWithExponentialBackoff(
    () =>
      NativeConnection.connect({
        address: env.TEMPORAL_ADDRESS,
      }),
    { label: "Temporal connect" },
  );
}

async function main(): Promise<void> {
  const connection = await connect();

  const worker = await Worker.create({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
    taskQueue: env.TEMPORAL_TASK_QUEUE,
    workflowsPath: require.resolve("./workflows"),
    activities: {},
  });

  console.log(
    `Temporal worker listening on task queue "${env.TEMPORAL_TASK_QUEUE}" (${env.TEMPORAL_ADDRESS})`,
  );

  await worker.run();
}

main().catch((error) => {
  console.error("Temporal worker failed:", error);
  process.exit(1);
});
