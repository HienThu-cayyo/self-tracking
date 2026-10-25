import { defineConfig, globalIgnores } from "eslint/config"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import boundaries from "eslint-plugin-boundaries"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const webRoot = dirname(fileURLToPath(import.meta.url))

const forbiddenLayers = {
  _app: ["app"],
  _shared: ["app", "_app", "_pages", "_widgets", "_features", "_entities"],
  _entities: ["app", "_app", "_pages", "_widgets", "_features"],
  _features: ["app", "_app", "_pages", "_widgets"],
  _widgets: ["app", "_app", "_pages"],
  _pages: ["app", "_app"],
}

const sliceLayers = ["_pages", "_widgets", "_features", "_entities"]
const layerOrder = ["app", "_app", ...sliceLayers, "_shared"]
const publicEntryPaths = ["index.ts", "index.tsx", "index.server.ts", "index.server.tsx"]

const layerBoundaries = Object.entries(forbiddenLayers).map(([layer, forbidden]) => ({
  basePath: webRoot,
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: forbidden.map((name) => ({
          group: [`@/${name}/**`, `**/${name}/**`],
          message: `${layer} cannot import from the higher ${name} layer.`,
        })),
      },
    ],
  },
}))

const publicEntryPolicies = sliceLayers.flatMap((targetLayer) => {
  const targetIndex = layerOrder.indexOf(targetLayer)

  return layerOrder.slice(0, targetIndex).flatMap((sourceLayer) => [
    {
      from: { element: { type: sourceLayer } },
      disallow: { to: { element: { type: targetLayer } } },
    },
    {
      from: { element: { type: sourceLayer } },
      allow: {
        to: { element: { type: targetLayer, fileInternalPath: publicEntryPaths } },
      },
    },
  ])
})

const siblingSlicePolicies = sliceLayers.map((layer) => ({
  from: { element: { type: layer } },
  disallow: {
    to: {
      element: {
        type: layer,
        captured: { slice: "!{{ from.element.captured.slice }}" },
      },
    },
  },
}))

const upwardLayerPolicies = layerOrder.flatMap((sourceLayer, sourceIndex) =>
  layerOrder.slice(0, sourceIndex).map((higherLayer) => ({
    from: { element: { type: sourceLayer } },
    disallow: { to: { element: { type: higherLayer } } },
  })),
)

const boundaryConfig = {
  basePath: webRoot,
  files: ["src/**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    "boundaries/root-path": webRoot,
    "boundaries/elements": [
      { type: "app", pattern: "src/app" },
      { type: "_app", pattern: "src/_app" },
      ...sliceLayers.map((layer) => ({
        type: layer,
        pattern: `src/${layer}/*`,
        capture: ["slice"],
      })),
      { type: "_shared", pattern: "src/_shared" },
    ],
    "import/resolver": {
      typescript: { project: resolve(webRoot, "tsconfig.json") },
    },
  },
  rules: {
    "boundaries/dependencies": [
      "error",
      {
        default: "allow",
        policies: [...publicEntryPolicies, ...siblingSlicePolicies, ...upwardLayerPolicies],
      },
    ],
  },
}

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  ...layerBoundaries,
  boundaryConfig,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
])
