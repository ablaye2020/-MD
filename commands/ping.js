import config from "../config.js";

export default async function pingCommand(message, client) {
  const start = Date.now();
  
  const sent = await client.sendMessage(message.key.remoteJid, {
    text: `╭━〔 🏓 𝐏𝐎𝐍𝐆 〕━⬣\n┃ ⏳ Calcul de la latence...\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
  }, { quoted: message });
  
  const end = Date.now();
  const latency = end - start;
  
  await client.sendMessage(message.key.remoteJid, {
    text: `╭━〔 🏓 𝐏𝐎𝐍𝐆 〕━⬣
┃ ⚡ Latence : *${latency} ms*
┃ 🤖 Bot : ${config.BotName}
┃ 👑 Dev : ${config.nameCreator}
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas
> 🔗 Voir la chaîne : ${config.Channel}`
  }, { quoted: message });
}
