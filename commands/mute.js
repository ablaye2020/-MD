import config from "../config.js";

const mutedMembers = new Map();
const mutedGroups = new Map();

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch(unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

function formatTime(ms) {
  if (!ms) return "indéfini";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} jour(s)`;
  if (hours > 0) return `${hours} heure(s)`;
  if (minutes > 0) return `${minutes} minute(s)`;
  return `${seconds} seconde(s)`;
}

export default async function muteCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔇 𝐌𝐔𝐓𝐄 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const meta = await client.groupMetadata(remoteJid);
  const senderJidBrut = message.key.participant || message.key.remoteJid;
  const senderNumero = getNumero(senderJidBrut);
  const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
  const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";
  const isOwner = senderNumero === "221769725470";

  if (!estAdmin && !isOwner) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔇 𝐌𝐔𝐓𝐄 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const subCommand = args[0]?.toLowerCase();
  const target = args[1];
  const duration = args[2];

  // Mute tout le groupe
  if (subCommand === "all") {
    const timeMs = parseTime(duration);
    
    if (!timeMs) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 🔇 𝐌𝐔𝐓𝐄 〕━⬣\n┃ ❌ Format invalide !\n┃ 📌 *.mute all 10m*\n┃ 📌 *.mute all 1h*\n┃ 📌 *.mute all 1d*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      });
    }

    mutedGroups.set(remoteJid, {
      active: true,
      expireAt: Date.now() + timeMs
    });

    setTimeout(() => {
      if (mutedGroups.get(remoteJid)?.active) {
        mutedGroups.delete(remoteJid);
        client.sendMessage(remoteJid, {
          text: `╭━〔 🔈 𝐌𝐔𝐓𝐄 𝐓𝐄𝐑𝐌𝐈𝐍𝐄́ 〕━⬣\n┃ ✅ Le groupe n'est plus en silencieux !\n┃ 💬 Vous pouvez à nouveau parler\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
        }).catch(() => {});
      }
    }, timeMs);

    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔇 𝐌𝐔𝐓𝐄 〕━⬣
┃ 🔇 Groupe mis en silencieux !
┃ ⏱️ Durée : *${formatTime(timeMs)}*
┃ 👑 Seuls les admins peuvent parler
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
    });
  }

  // Mute un membre spécifique
  const ctx = message.message?.extendedTextMessage?.contextInfo;
  const mentions = ctx?.mentionedJid || [];
  let cibleJid = null;

  if (ctx?.participant) {
    cibleJid = ctx.participant;
  } else if (mentions.length > 0) {
    cibleJid = mentions[0];
  } else if (target) {
    cibleJid = target.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  }

  if (!cibleJid) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔇 𝐌𝐔𝐓𝐄 〕━⬣\n┃ ❌ Mentionne quelqu'un !\n┃ 📌 *.mute @personne 10m*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const cibleNumero = getNumero(cibleJid);
  const cibleInfo = meta.participants.find(p => getNumero(p.id) === cibleNumero);

  if (!cibleInfo) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔇 𝐌𝐔𝐓𝐄 〕━⬣\n┃ ❌ Membre introuvable !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const cibleEstAdmin = cibleInfo?.admin === "admin" || cibleInfo?.admin === "superadmin";
  if (cibleEstAdmin && !isOwner) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔇 𝐌𝐔𝐓𝐄 〕━⬣\n┃ ❌ Tu ne peux pas mute un *admin* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const timeMs = parseTime(duration);
  if (!timeMs) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🔇 𝐌𝐔𝐓𝐄 〕━⬣\n┃ ❌ Format invalide !\n┃ 📌 *.mute @personne 10m*\n┃ 📌 *.mute @personne 1h*\n┃ 📌 *.mute @personne 1d*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const key = `${remoteJid}_${cibleNumero}`;
  mutedMembers.set(key, {
    active: true,
    expireAt: Date.now() + timeMs
  });

  setTimeout(() => {
    if (mutedMembers.get(key)?.active) {
      mutedMembers.delete(key);
      client.sendMessage(remoteJid, {
        text: `╭━〔 🔈 𝐌𝐔𝐓𝐄 𝐓𝐄𝐑𝐌𝐈𝐍𝐄́ 〕━⬣
┃ ✅ @${cibleNumero} peut à nouveau parler !
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`,
        mentions: [cibleJid]
      }).catch(() => {});
    }
  }, timeMs);

  await client.sendMessage(remoteJid, {
    text: `╭━〔 🔇 𝐌𝐔𝐓𝐄 〕━⬣
┃ 🔇 @${cibleNumero} a été mute !
┃ ⏱️ Durée : *${formatTime(timeMs)}*
┃ 👑 Par : @${senderNumero}
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`,
    mentions: [cibleJid, senderJidBrut]
  });
}

// Vérifier si un message doit être bloqué (à appeler dans handler.js)
export function isMuted(remoteJid, senderJid) {
  const senderNumero = getNumero(senderJid);
  const key = `${remoteJid}_${senderNumero}`;
  
  const groupMute = mutedGroups.get(remoteJid);
  if (groupMute?.active && groupMute.expireAt > Date.now()) {
    return true;
  }
  
  const memberMute = mutedMembers.get(key);
  if (memberMute?.active && memberMute.expireAt > Date.now()) {
    return true;
  }
  
  return false;
}
