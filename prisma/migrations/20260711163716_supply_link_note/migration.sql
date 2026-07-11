-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectSupply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "projectId" TEXT NOT NULL,
    CONSTRAINT "ProjectSupply_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjectSupply" ("id", "name", "order", "projectId", "quantity") SELECT "id", "name", "order", "projectId", "quantity" FROM "ProjectSupply";
DROP TABLE "ProjectSupply";
ALTER TABLE "new_ProjectSupply" RENAME TO "ProjectSupply";
CREATE INDEX "ProjectSupply_projectId_order_idx" ON "ProjectSupply"("projectId", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
