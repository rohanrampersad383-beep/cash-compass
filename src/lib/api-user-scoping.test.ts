import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function routeSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

test("category edit and delete routes scope mutations by authenticated user ID", () => {
  const source = routeSource("src/app/api/categories/[id]/route.ts");

  assert.match(source, /updateMany\(\{ where: \{ id, userId: user\.id \}/);
  assert.match(source, /findFirst\(\{ where: \{ id, userId: user\.id \}/);
  assert.match(source, /deleteMany\(\{ where: \{ id, userId: user\.id \}/);
});

test("ledger edit and delete routes scope each finance record source by authenticated user ID", () => {
  const source = routeSource("src/app/api/ledger/[source]/[id]/route.ts");

  assert.match(source, /transaction\.updateMany\(\{ where: \{ id, userId: user\.id \}/);
  assert.match(source, /income\.updateMany\(\{ where: \{ id, userId: user\.id \}/);
  assert.match(source, /expense\.updateMany\(\{ where: \{ id, userId: user\.id \}/);
  assert.match(source, /transaction\.deleteMany\(\{ where: \{ id, userId: user\.id \}/);
  assert.match(source, /income\.deleteMany\(\{ where: \{ id, userId: user\.id \}/);
  assert.match(source, /expense\.deleteMany\(\{ where: \{ id, userId: user\.id \}/);
});

test("statement upload validates categories through a user-scoped category lookup", () => {
  const source = routeSource("src/app/api/statement-upload/route.ts");

  assert.match(source, /category\.findMany\(\{ where: \{ id: \{ in: categoryIds \}, userId: user\.id/);
  assert.match(source, /validateCsvImportCategoryAssignment/);
});

test("account export route scopes every exported finance collection by authenticated user ID", () => {
  const source = routeSource("src/app/api/account/export/route.ts");

  for (const model of [
    "category",
    "transaction",
    "income",
    "expense",
    "bill",
    "budget",
    "savingsGoal",
    "uploadedStatement",
  ]) {
    assert.match(source, new RegExp(`prisma\\.${model}\\.findMany\\(\\{ where: \\{ userId: user\\.id \\}`));
  }
  assert.equal(source.includes("passwordHash"), false);
  assert.equal(source.includes("sessionHash"), false);
});
