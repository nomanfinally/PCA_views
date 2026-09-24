import { build } from "esbuild";
import type { Plugin } from "vite";
/** A separate IIFE bundles React, both renderers and CSS for file:// archives. */
export function archivePlugin(): Plugin {
  let cached: Promise<string> | undefined;
  const bundle = () =>
    (cached ??= build({
      entryPoints: ["src/main.tsx"],
      bundle: true,
      write: false,
      outfile: "archive-runtime.js",
      format: "iife",
      platform: "browser",
      target: "es2022",
      minify: true,
      legalComments: "inline",
      define: {
        "process.env.NODE_ENV": '"production"',
        "import.meta.url": '"file:///"',
      },
      loader: { ".css": "css" },
      jsx: "automatic",
    }).then((result) =>
      JSON.stringify({
        js: result.outputFiles.find((f) => f.path.endsWith(".js"))!.text,
        css: result.outputFiles.find((f) => f.path.endsWith(".css"))!.text,
      }),
    ));
  return {
    name: "pca-offline-archive",
    configureServer(server) {
      server.watcher.on("change", (file) => {
        if (file.includes("/src/")) cached = undefined;
      });
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.split("?")[0].endsWith("/archive-runtime.json"))
          return next();
        try {
          res.setHeader("Content-Type", "application/json");
          res.end(await bundle());
        } catch (e) {
          res.statusCode = 500;
          res.end(String(e));
        }
      });
    },
    async generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "archive-runtime.json",
        source: await bundle(),
      });
    },
  };
}
