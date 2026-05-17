import config from "../config.js";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";

const TEMP_DIR = path.join(process.cwd(), "temp_sessions");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const activeSessions = new Map();

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function nettoyerSession(sessionId, sessionPath) {
  const s = activeSessions.get(sessionId);
  if (s?.timeout) clearTimeout(s.timeout);
  if (s?.client) { try { s.client.end(); } catch (_) {} }
  if (sessionPath && fs.existsSync(sessionPath)) {
    try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch (_) {}
  }
  activeSessions.delete(sessionId);
}

export default async function pairCommand(message, client, { args, sender } = {}) {
  const remoteJid = message.key.remoteJid;
  const userNumber = sender;
  const sub = args?.[0]?.toLowerCase();

  if (sub === "stop") {
    const id = args[1];
    if (id && activeSessions.has(id)) {
      const s = activeSessions.get(id);
      if (s.userNumber !== userNumber) {
        return await client.sendMessage(remoteJid, {
          text: `╭━〔 ⛔ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ❌ Session introuvable !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
        }, { quoted: message });
      }
      nettoyerSession(id, s.sessionPath);
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 ✅ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ✅ Session *${id}* arrêtée !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }

    let count = 0;
    for (const [id, s] of activeSessions) {
      if (s.userNumber === userNumber) {
        nettoyerSession(id, s.sessionPath);
        count++;
      }
    }
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 ✅ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ✅ *${count}* session(s) arrêtée(s)\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  if (sub === "list") {
    const mes = [...activeSessions.values()].filter(s => s.userNumber === userNumber);
    if (mes.length === 0) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 📱 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ⚠️ Aucune session active\n┃ 📌 Ex: *.pair 2250701234567*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }
    let txt = `╭━〔 📱 𝐏𝐀𝐈𝐑 〕━⬣\n`;
    let i = 1;
    for (const [id, s] of activeSessions) {
      if (s.userNumber !== userNumber) continue;
      const reste = Math.max(0, Math.ceil((s.expireAt - Date.now()) / 1000));
      txt += `┃ ${i++}. 📞 *${s.numero}*\n┃    🆔 \`${id}\`\n┃    ⏱️ ${reste}s restantes\n┃\n`;
    }
    txt += `┃ 📌 *.pair stop [id]*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`;
    return await client.sendMessage(remoteJid, { text: txt }, { quoted: message });
  }

  if (sub === "status") {
    const mesCount = [...activeSessions.values()].filter(s => s.userNumber === userNumber).length;
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 📊 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ✅ Service *actif*\n┃ 📱 Total sessions : *${activeSessions.size}*\n┃ 👤 Tes sessions : *${mesCount}*\n┣━━━━━━━━━━━━━━━━━━━━⬣\n┃ 📌 *.pair 2250701234567*\n┃ 📌 *.pair list*\n┃ 📌 *.pair stop*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const numero = args?.[0]?.replace(/[^0-9]/g, "") || null;

  if (!numero) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔗 𝐏𝐀𝐈𝐑 〕━⬣\n┃ 📌 *.pair 2250701234567*\n┃ 📌 *.pair list*\n┃ 📌 *.pair stop*\n┃ 📌 *.pair status*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  if (numero.length < 7 || numero.length > 15) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 ❌ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ❌ Numéro invalide !\n┃ 📌 Ex: *.pair 2250701234567*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const mesSessions = [...activeSessions.values()].filter(s => s.userNumber === userNumber);
  if (mesSessions.length >= 3) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 ❌ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ❌ Maximum *3 sessions* atteint !\n┃ 📌 *.pair stop* pour libérer\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  await client.sendMessage(remoteJid, {
    text: `╭━〔 🔗 𝐏𝐀𝐈𝐑 〕━⬣\n┃ 📞 *+${numero}*\n┃ ⏳ Génération en cours...\n┃ ⚠️ Patiente quelques secondes\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
  }, { quoted: message });

  const sessionId = genId();
  const sessionPath = path.join(TEMP_DIR, sessionId);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      printQRInTerminal: false,
    });

    const timeout = setTimeout(async () => {
      nettoyerSession(sessionId, sessionPath);
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ⏰ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ⏰ Session expirée !\n┃ 📌 Relance : *.pair ${numero}*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }).catch(() => {});
    }, 120000);

    activeSessions.set(sessionId, {
      client: sock,
      numero,
      userNumber,
      sessionPath,
      expireAt: Date.now() + 120000,
      timeout
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
      if (connection === "open") {
        await client.sendMessage(remoteJid, {
          text: `╭━〔 ✅ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ 🎉 *+${numero}* connecté !\n┃ ⚡ ${config.BotName} est actif !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
        }).catch(() => {});
        nettoyerSession(sessionId, sessionPath);
      } else if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
          await client.sendMessage(remoteJid, {
            text: `╭━〔 ❌ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ❌ Connexion fermée\n┃ 📌 Relance : *.pair ${numero}*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
          }).catch(() => {});
          nettoyerSession(sessionId, sessionPath);
        }
      }
    });

    await new Promise(r => setTimeout(r, 2000));
    const code = await sock.requestPairingCode(numero);

    if (!code) throw new Error("Code non reçu, réessaie.");

    setTimeout(() => nettoyerSession(sessionId, sessionPath), 180000);

    await client.sendMessage(remoteJid, {
      text: `╭━〔 🔑 𝐂𝐎𝐃𝐄 𝐃𝐄 𝐏𝐀𝐈𝐑𝐀𝐆𝐄 〕━⬣
┃
┃ 📞 Numéro : *+${numero}*
┃ 🔑 Code   : *${code}*
┃ ⏱️ Valable : *2 minutes*
┃
┣━━〔 📲 COMMENT L'UTILISER 〕━⬣
┃
┃ 1️⃣ Ouvre *WhatsApp*
┃ 2️⃣ Paramètres → Appareils liés
┃ 3️⃣ Lier un appareil
┃ 4️⃣ Entrer le code manuellement
┃ 5️⃣ Tape : *${code}*
┃
┣━━〔 ⚡ ${config.BotName} 〕━⬣
┃ 👑 Dev : ${config.nameCreator}
╰━━━━━━━━━━━━━━━━━━━━⬣
> le respect ne se demande pas`
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur pairCommand:", err.message);
    nettoyerSession(sessionId, sessionPath);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ❌ 𝐏𝐀𝐈𝐑 〕━⬣\n┃ ⚠️ Erreur : ${err.message}\n┃ 📌 Réessaie : *.pair ${numero}*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }
}
