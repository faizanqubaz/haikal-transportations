import { PostgresSaver } from
  "@langchain/langgraph-checkpoint-postgres";

const connectionString:any =
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "POSTGRES_URL environment variable is missing."
  );
}

/**
 * Keep the checkpointer on the server.
 *
 * Vercel can reuse the same module during a warm
 * serverless instance.
 */
let checkpointerPromise:
  | Promise<PostgresSaver>
  | undefined;

export function getCheckpointer(): Promise<PostgresSaver> {
  if (!checkpointerPromise) {
    checkpointerPromise = createCheckpointer();
  }

  return checkpointerPromise;
}

async function createCheckpointer() {
  const checkpointer =
    PostgresSaver.fromConnString(
      connectionString
    );

  /**
   * Creates LangGraph checkpoint tables.
   *
   * setup() is safe to run when the application
   * starts. The package keeps track of setup state.
   */
  await checkpointer.setup();

  return checkpointer;
}