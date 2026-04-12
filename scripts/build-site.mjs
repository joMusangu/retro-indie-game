/**
 * Assembles ./dist for static hosting (GitHub Pages, etc.).
 * Copies compiled game.js, index.html, arena image, and sprite folders.
 * Run after `npm run build` (tsc).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

/** Top-level asset folders referenced by game.ts (copy if present). */
const ASSET_DIRS = [
    "Fantasy Warrior",
    "Martial Hero",
    "Martial Hero 2",
    "Martial Hero 3",
    "Medieval Warrior Pack 2",
    "Medieval Warrior Pack 3",
    "Huntress",
    "Huntress 2",
    "Evil Wizard 3",
];

const ROOT_FILES = ["index.html", "game.js", "IMG_4822.png"];

function rmrf(p) {
    if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
    const st = fs.statSync(src);
    if (st.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const name of fs.readdirSync(src)) {
            if (name === ".git") continue;
            copyRecursive(path.join(src, name), path.join(dest, name));
        }
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

rmrf(dist);
fs.mkdirSync(dist, { recursive: true });

let missingRequired = false;
for (const name of ROOT_FILES) {
    const src = path.join(root, name);
    if (!fs.existsSync(src)) {
        if (name === "index.html" || name === "game.js") {
            console.error(`build-site: required file missing: ${name}`);
            missingRequired = true;
        } else {
            console.warn(`build-site: optional file missing: ${name}`);
        }
        continue;
    }
    copyRecursive(src, path.join(dist, name));
}

for (const dir of ASSET_DIRS) {
    const src = path.join(root, dir);
    if (!fs.existsSync(src)) {
        console.warn(`build-site: asset folder missing (game may break online): ${dir}`);
        continue;
    }
    copyRecursive(src, path.join(dist, dir));
}

if (missingRequired) process.exit(1);
console.log("build-site: wrote", dist);
