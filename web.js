import http from "http";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import fs from "fs";
import config from "./config.js";

const PORT = process.env.PORT || 3000;
const sessions = new Map();

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

async function genererCode(numero) {
  const sessionDir = `./sessions_web/${numero}`;
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log(`✅ ${numero} connecté via web !`);
      sessions.set(numero, { status: "connected", sock });
    } else if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`❌ ${numero} déconnecté (${reason})`);
      sessions.delete(numero);
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  const code = await sock.requestPairingCode(numero);
  sessions.set(numero, { status: "pending", sock, code });

  setTimeout(() => {
    const s = sessions.get(numero);
    if (s?.status === "pending") {
      try { s.sock.end(); } catch (_) {}
      sessions.delete(numero);
      console.log(`🧹 Session ${numero} nettoyée`);
    }
  }, 300000);

  return code;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, bot: config.BotName }));
  }

  if (req.method === "POST" && url.pathname === "/pair") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const { numero } = JSON.parse(body);

        if (!numero || !/^\d{7,15}$/.test(numero)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ ok: false, error: "Numéro invalide" }));
        }

        console.log(`📱 Demande de code pour : +${numero}`);
        const code = await genererCode(numero);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, code, numero }));

      } catch (err) {
        console.error("Erreur /pair:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/check") {
    const numero = url.searchParams.get("numero");
    const session = sessions.get(numero);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      ok: true,
      status: session?.status || "not_found"
    }));
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "Route introuvable" }));
});

server.listen(PORT, () => {
  console.log(`╭─────────────────────────────╮`);
  console.log(`│  🌐 Serveur web démarré      │`);
  console.log(`│  🔗 Port : ${PORT}               │`);
  console.log(`│  📛 Bot  : J O Y ~ M D  │`);
  console.log(`╰─────────────────────────────╯`);
});
