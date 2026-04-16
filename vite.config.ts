import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

// Read request body helper
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
  });
}

// Dev-only plugin: proxy /api/whatsapp/* to WhatsApp Cloud API
function whatsappApiPlugin(): Plugin {
  let env: Record<string, string>;

  return {
    name: "whatsapp-api-dev",
    configResolved(config) {
      env = loadEnv(config.mode, config.root, "");
    },
    configureServer(server) {
      // GET /api/whatsapp/templates
      server.middlewares.use(
        "/api/whatsapp/templates",
        async (_req: IncomingMessage, res: ServerResponse) => {
          try {
            const token = env.WHATSAPP_TOKEN;
            const businessAccountId = env.WHATSAPP_BUSINESS_ACCOUNT_ID;

            if (!token || !businessAccountId) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: "WhatsApp credentials not configured in .env",
                })
              );
              return;
            }

            const response = await fetch(
              `https://graph.facebook.com/v19.0/${businessAccountId}/message_templates?status=APPROVED`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await response.json();

            if (!response.ok) {
              res.writeHead(response.status, {
                "Content-Type": "application/json",
              });
              res.end(
                JSON.stringify({
                  error: data.error?.message || "WhatsApp API error",
                })
              );
              return;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ templates: data.data || [] }));
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: "Failed to fetch templates" })
            );
          }
        }
      );

      // POST /api/whatsapp/send
      server.middlewares.use(
        "/api/whatsapp/send",
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== "POST") {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }

          try {
            const body = await readBody(req);
            const {
              to,
              templateName,
              languageCode = "en",
              components = [],
            } = JSON.parse(body);

            if (!to || !templateName) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: "to and templateName are required",
                })
              );
              return;
            }

            const token = env.WHATSAPP_TOKEN;
            const phoneNumberId = env.PHONE_NUMBER_ID;

            if (!token || !phoneNumberId) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: "WhatsApp credentials not configured in .env",
                })
              );
              return;
            }

            const phone = String(to).replace(/\D/g, "");

            const messageBody = {
              messaging_product: "whatsapp",
              to: phone,
              type: "template",
              template: {
                name: templateName,
                language: { code: languageCode },
                ...(components.length > 0 ? { components } : {}),
              },
            };

            const response = await fetch(
              `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(messageBody),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              res.writeHead(response.status, {
                "Content-Type": "application/json",
              });
              res.end(
                JSON.stringify({
                  error: data.error?.message || "Send failed",
                })
              );
              return;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, result: data }));
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error:
                  error instanceof Error ? error.message : "Send failed",
              })
            );
          }
        }
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), whatsappApiPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
