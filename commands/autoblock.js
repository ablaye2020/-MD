import config from "../config.js";

const activeAutoBlocks = new Map();

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

export default async function autoblockCommand(message, client, { args, sender, isOwner } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!isOwner) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ❌ Réservé au propriétaire !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const subCommand = args[0]?.toLowerCase();

  // .autoblock stop
  if (subCommand === "stop") {
    const targetNumero = args[1]?.replace(/[^0-9]/g, "");
    
    if (!targetNumero) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ❌ Numéro manquant !\n┃ 📌 *.autoblock stop 221769725470*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }

    const session = activeAutoBlocks.get(targetNumero);
    if (session) {
      if (session.interval) clearInterval(session.interval);
      activeAutoBlocks.delete(targetNumero);
      
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ✅ Auto-bloc arrêté pour +${targetNumero}\n┃ 📊 Total cycles : *${session.count}*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    } else {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ⚠️ Aucun auto-bloc actif pour +${targetNumero}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }
  }

  // .autoblock list
  if (subCommand === "list") {
    if (activeAutoBlocks.size === 0) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ⚠️ Aucun auto-bloc actif\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }

    let listText = `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n`;
    let i = 1;
    for (const [numero, session] of activeAutoBlocks) {
      listText += `┃ ${i++}. +${numero}\n`;
      listText += `┃    🔄 Cycles : ${session.count}\n`;
      listText += `┃    ⏱️ Intervalle : ${session.intervalSeconds}s\n┃\n`;
    }
    listText += `╰━━〔 ⚡ ${config.BotName} 〕━⬣\n> le respect ne se demande pas`;
    
    return await client.sendMessage(remoteJid, { text: listText }, { quoted: message });
  }

  // .autoblock <numero> <intervalle>
  const targetNumero = args[0]?.replace(/[^0-9]/g, "");
  const intervalSeconds = parseInt(args[1]);

  if (!targetNumero || targetNumero.length < 7) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ❌ Numéro invalide !\n┃ 📌 *.autoblock 221769725470 2*\n┃ (2 = blocage/déblocage toutes les 2 secondes)\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  if (isNaN(intervalSeconds) || intervalSeconds < 1 || intervalSeconds > 60) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ❌ Intervalle invalide ! (1-60 secondes)\n┃ 📌 *.autoblock ${targetNumero} 2*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  if (activeAutoBlocks.has(targetNumero)) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ⚠️ Auto-bloc déjà actif pour +${targetNumero}\n┃ 📌 *.autoblock stop ${targetNumero}*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const targetJid = `${targetNumero}@s.whatsapp.net`;
  let count = 0;
  let isBlocked = false;

  await client.sendMessage(remoteJid, {
    text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣
┃ 🎯 Cible : +${targetNumero}
┃ ⏱️ Intervalle : ${intervalSeconds} secondes
┃ 🔄 Démarrage...
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
  }, { quoted: message });

  const interval = setInterval(async () => {
    try {
      if (isBlocked) {
        await client.updateBlockStatus(targetJid, "unblock");
        isBlocked = false;
        console.log(`🔓 Débloqué : +${targetNumero} (cycle ${count + 1})`);
      } else {
        await client.updateBlockStatus(targetJid, "block");
        isBlocked = true;
        count++;
        console.log(`🔒 Bloqué : +${targetNumero} (cycle ${count})`);
        
        const session = activeAutoBlocks.get(targetNumero);
        if (session) {
          session.count = count;
        }
      }
    } catch (err) {
      console.error(`Erreur autoblock pour +${targetNumero}:`, err.message);
      clearInterval(interval);
      activeAutoBlocks.delete(targetNumero);
    }
  }, intervalSeconds * 1000);

  activeAutoBlocks.set(targetNumero, {
    interval,
    count: 0,
    intervalSeconds,
    startTime: Date.now()
  });
}

// Commande .stopallblocks
export async function stopAllBlocksCommand(message, client, { isOwner } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!isOwner) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ❌ Réservé au propriétaire !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  let stopped = 0;
  for (const [numero, session] of activeAutoBlocks) {
    if (session.interval) clearInterval(session.interval);
    activeAutoBlocks.delete(numero);
    stopped++;
  }

  await client.sendMessage(remoteJid, {
    text: `╭━〔 🚫 𝐀𝐔𝐓𝐎𝐁𝐋𝐎𝐂𝐊 〕━⬣\n┃ ✅ ${stopped} auto-bloc(s) arrêté(s)\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
  });
}
