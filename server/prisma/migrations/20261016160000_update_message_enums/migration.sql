-- AlterEnum
ALTER TYPE "MessageRole" RENAME VALUE 'user' TO 'USER';
ALTER TYPE "MessageRole" RENAME VALUE 'assistant' TO 'ASSISTANT';

-- AlterEnum
ALTER TYPE "MessageType" RENAME VALUE 'result' TO 'RESULT';
ALTER TYPE "MessageType" RENAME VALUE 'error' TO 'ERROR';
