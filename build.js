const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const watch = process.argv.includes("--watch");

const root = __dirname;
const publicDir = path.join(root, "public");
const outDir = path.join(root, "extension");
const distDir = path.join(outDir, "dist");

function copyPublic() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  for (const file of fs.readdirSync(publicDir)) {
    fs.copyFileSync(path.join(publicDir, file), path.join(outDir, file));
  }
}

const config = {
  entryPoints: {
    background: "src/background.ts",
    content: "src/content.ts",
    sidepanel: "src/sidepanel.ts",
    options: "src/options.ts"
  },
  bundle: true,
  outdir: "extension/dist",
  format: "esm",
  target: "chrome116",
  sourcemap: true,
  logLevel: "info"
};

(async () => {
  copyPublic();

  if (watch) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log("Watching...");
  } else {
    await esbuild.build(config);
    console.log("Build complete: extension/");
  }
})();