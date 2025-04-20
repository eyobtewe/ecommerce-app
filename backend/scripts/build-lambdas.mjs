import { build } from "esbuild";
import { readdirSync } from "fs";
import { join, basename } from "path";

// Top-level folders (relative to backend/src/)
const lambdaDirs = ["product", "admin", "cart", "order", "user", "review","utils"];

for (const dir of lambdaDirs) {
  const fullDirPath = join("src", dir);
  const files = readdirSync(fullDirPath).filter((f) => f.endsWith(".js")); // changed from .ts

  for (const file of files) {
    const entry = join(fullDirPath, file); // e.g. backend/src/cart/saveCart.js
    const name = basename(file, ".js"); // e.g. saveCart
    const out = join("dist", `${name}.js`); // dist/saveCart.js

    await build({
      entryPoints: [entry],
      bundle: true,
      platform: "node",
      target: "node22",
      outfile: out,
      format: "cjs",
    });

    console.log(`✅ Built ${entry} → ${out}`);
  }
}
