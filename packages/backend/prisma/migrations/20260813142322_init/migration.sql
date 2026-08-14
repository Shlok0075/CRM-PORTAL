/*
  Warnings:

  - Added the required column `orgId` to the `TaskDocumentRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orgId` to the `TaskTimeLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TaskDocumentRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "clientId" TEXT,
    "documentName" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "uploadedDocumentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskDocumentRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskDocumentRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskDocumentRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TaskDocumentRequest" ("category", "clientId", "createdAt", "documentName", "id", "status", "taskId", "uploadedDocumentId") SELECT "category", "clientId", "createdAt", "documentName", "id", "status", "taskId", "uploadedDocumentId" FROM "TaskDocumentRequest";
DROP TABLE "TaskDocumentRequest";
ALTER TABLE "new_TaskDocumentRequest" RENAME TO "TaskDocumentRequest";
CREATE TABLE "new_TaskTimeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "durationMinutes" INTEGER,
    "description" TEXT,
    CONSTRAINT "TaskTimeLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskTimeLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskTimeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TaskTimeLog" ("description", "durationMinutes", "endTime", "id", "startTime", "taskId", "userId") SELECT "description", "durationMinutes", "endTime", "id", "startTime", "taskId", "userId" FROM "TaskTimeLog";
DROP TABLE "TaskTimeLog";
ALTER TABLE "new_TaskTimeLog" RENAME TO "TaskTimeLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
