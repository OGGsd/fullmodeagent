import react from "@vitejs/plugin-react-swc";
import * as dotenv from "dotenv";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

// Vercel-optimized Vite configuration for Axie Studio Frontend
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Load environment variables
  const envLangflowResult = dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
  });

  const envLangflow = envLangflowResult.parsed || {};

  // API routes for proxy
  const apiRoutes = ["^/api/v1/", "^/api/v2/", "/health"];

  // Backend URL - prioritize Vercel environment variables
  const backendUrl = 
    env.VITE_BACKEND_URL || 
    process.env.VITE_BACKEND_URL || 
    "https://agent-platform-backend.ondigitalocean.app";

  // Backend URL - your existing instance
  const langflowUrl = 
    env.VITE_LANGFLOW_URL || 
    process.env.VITE_LANGFLOW_URL || 
    "https://your-langflow-instance.ondigitalocean.app";

  const port = Number(env.VITE_PORT) || 3000;

  // Proxy configuration for development
  const proxyTargets = apiRoutes.reduce((proxyObj, route) => {
    proxyObj[route] = {
      target: backendUrl,
      changeOrigin: true,
      secure: true,
      ws: true,
      headers: {
        'X-Forwarded-Host': 'localhost:' + port,
        'X-Forwarded-Proto': 'http'
      }
    };
    return proxyObj;
  }, {});

  return {
    base: "/",
    build: {
      outDir: "dist", // Vercel expects 'dist' by default
      sourcemap: false, // Disable sourcemaps for production
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['lucide-react'],
            utils: ['axios']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    define: {
      // Backend configuration
      "process.env.BACKEND_URL": JSON.stringify(backendUrl),
      "process.env.LANGFLOW_URL": JSON.stringify(langflowUrl),
      
      // Multi-tenant configuration
      "process.env.VITE_MULTI_TENANT": JSON.stringify(
        env.VITE_MULTI_TENANT || "true"
      ),
      "process.env.VITE_DEFAULT_DOMAIN": JSON.stringify(
        env.VITE_DEFAULT_DOMAIN || "axiestudio.com"
      ),
      "process.env.VITE_CONTACT_EMAIL": JSON.stringify(
        env.VITE_CONTACT_EMAIL || "stefan@axiestudio.se"
      ),
      
      // Langflow configuration
      "process.env.ACCESS_TOKEN_EXPIRE_SECONDS": JSON.stringify(
        envLangflow.ACCESS_TOKEN_EXPIRE_SECONDS ?? 3600
      ),
      "process.env.CI": JSON.stringify(envLangflow.CI ?? false),
      "process.env.LANGFLOW_AUTO_LOGIN": JSON.stringify(
        envLangflow.LANGFLOW_AUTO_LOGIN ?? false
      ),
      "process.env.LANGFLOW_FEATURE_MCP_COMPOSER": JSON.stringify(
        envLangflow.LANGFLOW_FEATURE_MCP_COMPOSER ?? "false"
      ),
      
      // Vercel-specific
      "process.env.VERCEL": JSON.stringify(process.env.VERCEL || "false"),
      "process.env.NODE_ENV": JSON.stringify(mode)
    },
    plugins: [
      react(), 
      svgr(), 
      tsconfigPaths()
    ],
    server: {
      port: port,
      host: true, // Allow external connections
      proxy: {
        ...proxyTargets,
      },
    },
    preview: {
      port: 4173,
      host: true
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react']
    }
  };
});
