import config from "../config.js";
import { getThemePhoto, getThemeEmoji, THEMES, groupThemes } from "./theme.js";

export default async function menuCommand(message, client) {
  try {
    const remoteJid = message.key.remoteJid;
    const themeName = groupThemes.get(remoteJid) || "yuta";
    const theme = THEMES[themeName];
    const photo = getThemePhoto(remoteJid);
    const emoji = theme?.emoji || "⚡";

    const menuText = `╭━〔 ${emoji} 𝐉 𝐎 𝐘 ~ 𝐌 𝐃 〕━⬣
┃ 📛 𝗕𝗼𝘁     : J O Y ~ M D
┃ 👑 𝗗𝗲𝘃     : JOYBOY
┃ 📌 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0.0
┃ 🎨 𝗧𝗵è𝗺𝗲  : ${theme?.nom || "Yuta"}
┣━━〔 🎮 𝗝𝗘𝗨𝗫 〕━⬣
┃ ❏ .quiz
┃ ❏ .manga
┃ ❏ .kamui
┣━━〔 🎵 𝗠𝗘𝗗𝗜𝗔 〕━⬣
┃ ❏ .play
┃ ❏ .tts
┃ ❏ .vv
┃ ❏ .s
┣━━〔 🤖 𝗜𝗡𝗧𝗘𝗟𝗟𝗜𝗚𝗘𝗡𝗖𝗘 〕━⬣
┃ ❏ .ai
┃ ❏ .automsg
┣━━〔 🛡️ 𝗚𝗥𝗢𝗨𝗣𝗘 〕━⬣
┃ ❏ .antilink
┃ ❏ .antidemote
┃ ❏ .welcome
┃ ❏ .goodbye
┣━━〔 👮 𝗔𝗗𝗠𝗜𝗡𝗜𝗦𝗧𝗥𝗔𝗧𝗜𝗢𝗡 〕━⬣
┃ ❏ .kick
┃ ❏ .kickall
┃ ❏ .mute
┃ ❏ .unmute
┃ ❏ .promote
┃ ❏ .demote
┃ ❏ .demoteall
┃ ❏ .tag
┃ ❏ .tagall
┣━━〔 🔧 𝗢𝗨𝗧𝗜𝗟𝗦 〕━⬣
┃ ❏ .ping
┃ ❏ .fancy
┃ ❏ .pair
┃ ❏ .channel
┃ ❏ .repo
┃ ❏ .theme
┃ ❏ .menu
┣━━〔 😈 𝐉 𝐎 𝐘 ~ 𝐌 𝐃 〕━⬣
┃ ❏ .no
┃ ❏ .noname
╰━━〔 ${emoji} 𝐉 𝐎 𝐘 ~ 𝐌 𝐃 〕━⬣
> JOYBOY
> 🔗 Voir la chaîne : ${config.Channel}
> le respect ne se demande pas`;

    await client.sendMessage(remoteJid, {
      image: { url: photo },
      caption: menuText
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur menuCommand:", err.message);
  }
}
