import config from "../config.js";

export const antiLinkGroups = new Map();

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

// Liste des domaines interdits
const LIENS_INTERDITS = [
  "chat.whatsapp.com",
  "whatsapp.com/invite",
  "youtube.com/shorts",
  "youtu.be",
  "t.me",
  "telegram.me",
  "instagram.com",
  "facebook.com",
  "fb.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "snapchat.com",
  "discord.gg",
  "discord.com/invite",
  "linktr.ee",
  "bit.ly",
  "tinyurl.com",
  "cutt.ly",
  "ow.ly",
  "is.gd",
  "cli.re",
  "short.link",
  "goo.gl",
  "rb.gy",
  "shorturl.at"
];

function contientLienInterdit(texte) {
  if (!texte) return false;
  const texteLower = texte.toLowerCase();
  for (const lien of LIENS_INTERDITS) {
    if (texteLower.includes(lien)) {
      return lien;
    }
  }
  return false;
}

export default async function antilinkCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const meta = await client.groupMetadata(remoteJid);
  const senderJidBrut = message.key.participant || message.key.remoteJid;
  const senderNumero = getNumero(senderJidBrut);
  const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
  const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

  if (!estAdmin) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const option = args[0]?.toLowerCase();

  if (option === "on") {
    antiLinkGroups.set(remoteJid, true);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣\n┃ ✅ Anti-lien *ACTIVÉ* !\n┃ 🔗 Les liens seront supprimés\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  } else if (option === "off") {
    antiLinkGroups.delete(remoteJid);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣\n┃ ❌ Anti-lien *DÉSACTIVÉ*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  } else {
    const statut = antiLinkGroups.has(remoteJid) ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ";
    await client.sendMessage(remoteJid, {
      text: `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣\n┃ 📊 Statut : *${statut}*\n┃ 📌 *.antilink on* → Activer\n┃ 📌 *.antilink off* → Désactiver\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }
}

export async function handleAntiLink(message, client) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) return;
  if (!antiLinkGroups.has(remoteJid)) return;

  try {
    const meta = await client.groupMetadata(remoteJid);
    const senderJid = message.key.participant || message.key.remoteJid;
    const senderNumero = getNumero(senderJid);
    const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
    const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

    // Les admins ne sont pas concernés
    if (estAdmin) return;

    let text = message.message?.conversation ||
              message.message?.extendedTextMessage?.text ||
              message.message?.imageMessage?.caption ||
              message.message?.videoMessage?.caption || "";

    const lienTrouve = contientLienInterdit(text);
    
    if (lienTrouve) {
      // Supprimer le message contenant le lien
      try {
        await client.sendMessage(remoteJid, {
          delete: message.key
        });
        console.log(`🗑️ Message supprimé (lien: ${lienTrouve}) de ${senderNumero}`);
      } catch (err) {
        console.log("❌ Impossible de supprimer le message:", err.message);
      }

      // Envoyer un avertissement
      await client.sendMessage(remoteJid, {
        text: `╭━〔 🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊 〕━⬣
┃ ⚠️ @${senderNumero} a envoyé un lien interdit !
┃ 🔗 Lien détecté : *${lienTrouve}*
┃ ❌ Message supprimé automatiquement
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`,
        mentions: [senderJid]
      });
    }
  } catch (err) {
    console.error("Erreur handleAntiLink:", err.message);
  }
}
