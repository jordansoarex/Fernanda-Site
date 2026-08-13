import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = join(projectRoot, ".dist");

if (dirname(outputDirectory) !== projectRoot || outputDirectory === projectRoot) {
  throw new Error("Diretório de publicação inválido");
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const publicDirectories = ["assets", ".well-known"];
const publicFileNames = new Set(["_headers"]);
const publicExtensions = new Set([".html", ".xml", ".txt", ".webmanifest"]);

for (const directory of publicDirectories) {
  await cp(join(projectRoot, directory), join(outputDirectory, directory), {
    recursive: true,
  });
}

for (const entry of await readdir(projectRoot, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const extension = entry.name.includes(".")
    ? entry.name.slice(entry.name.lastIndexOf("."))
    : "";
  if (!publicFileNames.has(entry.name) && !publicExtensions.has(extension)) continue;
  await cp(join(projectRoot, entry.name), join(outputDirectory, entry.name));
}

const forbidden = new Set([".dev.vars", ".env", "node_modules", ".git"]);
const generatedEntries = await readdir(outputDirectory);
const leaked = generatedEntries.filter((entry) => forbidden.has(entry));
if (leaked.length) {
  throw new Error(`Arquivo privado no pacote de publicação: ${leaked.join(", ")}`);
}

console.log(`Pacote público preparado em ${outputDirectory}`);
