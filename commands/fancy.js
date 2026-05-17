import config from "../config.js";

// Styles de texte fancy
const FONTS = {
  bold: (text) => text.split('').map(c => c.replace(/[a-zA-Z]/g, (l) => String.fromCodePoint(l.charCodeAt(0) + 120734))).join(''),
  italic: (text) => text.split('').map(c => c.replace(/[a-zA-Z]/g, (l) => String.fromCodePoint(l.charCodeAt(0) + 120760))).join(''),
  boldItalic: (text) => text.split('').map(c => c.replace(/[a-zA-Z]/g, (l) => String.fromCodePoint(l.charCodeAt(0) + 120786))).join(''),
  script: (text) => text.toLowerCase().split('').map(c => {
    const map = { a: '𝒶', b: '𝒷', c: '𝒸', d: '𝒹', e: 'ℯ', f: '𝒻', g: 'ℊ', h: '𝒽', i: '𝒾', j: '𝒿', k: '𝓀', l: '𝓁', m: '𝓂', n: '𝓃', o: 'ℴ', p: '𝓅', q: '𝓆', r: '𝓇', s: '𝓈', t: '𝓉', u: '𝓊', v: '𝓋', w: '𝓌', x: '𝓍', y: '𝓎', z: '𝓏' };
    return map[c] || c;
  }).join(''),
  doubleStruck: (text) => text.toUpperCase().split('').map(c => {
    const map = { A: '𝔸', B: '𝔹', C: 'ℂ', D: '𝔻', E: '𝔼', F: '𝔽', G: '𝔾', H: 'ℍ', I: '𝕀', J: '𝕁', K: '𝕂', L: '𝕃', M: '𝕄', N: 'ℕ', O: '𝕆', P: 'ℙ', Q: 'ℚ', R: 'ℝ', S: '𝕊', T: '𝕋', U: '𝕌', V: '𝕍', W: '𝕎', X: '𝕏', Y: '𝕐', Z: 'ℤ' };
    return map[c] || c;
  }).join(''),
  monospace: (text) => text.split('').map(c => {
    const map = { a: '𝚊', b: '𝚋', c: '𝚌', d: '𝚍', e: '𝚎', f: '𝚏', g: '𝚐', h: '𝚑', i: '𝚒', j: '𝚓', k: '𝚔', l: '𝚕', m: '𝚖', n: '𝚗', o: '𝚘', p: '𝚙', q: '𝚚', r: '𝚛', s: '𝚜', t: '𝚝', u: '𝚞', v: '𝚟', w: '𝚠', x: '𝚡', y: '𝚢', z: '𝚣' };
    return map[c] || c;
  }).join(''),
  smallCaps: (text) => text.toUpperCase().split('').map(c => {
    const map = { A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ꜰ', G: 'ɢ', H: 'ʜ', I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ', Q: 'ǫ', R: 'ʀ', S: 'ꜱ', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x', Y: 'ʏ', Z: 'ᴢ' };
    return map[c] || c;
  }).join('')
};

export default async function fancyCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!args || args.length === 0) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 ✨ 𝐅𝐀𝐍𝐂𝐘 〕━⬣
┃ 📌 *.fancy <texte>*
┃ 
┃ Exemple : *.fancy Joy*
┃ 
┃ Styles disponibles :
┃ • bold
┃ • italic
┃ • boldItalic
┃ • script
┃ • doubleStruck
┃ • monospace
┃ • smallCaps
┃ 
┃ 📌 *.fancy bold Joy*
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
    }, { quoted: message });
  }

  let style = "all";
  let text = args.join(" ");

  // Vérifier si un style est spécifié
  const styleNames = ["bold", "italic", "boldItalic", "script", "doubleStruck", "monospace", "smallCaps"];
  if (styleNames.includes(args[0].toLowerCase())) {
    style = args[0].toLowerCase();
    text = args.slice(1).join(" ");
  }

  if (!text) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 ✨ 𝐅𝐀𝐍𝐂𝐘 〕━⬣\n┃ ❌ Texte manquant !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  let result = "";

  if (style === "all") {
    result = `╭━〔 ✨ 𝐅𝐀𝐍𝐂𝐘 〕━⬣
┃ 📝 Texte original : *${text}*
┃
┃ 🔥 Bold : ${FONTS.bold(text)}
┃ 📖 Italic : ${FONTS.italic(text)}
┃ ⚡ BoldItalic : ${FONTS.boldItalic(text)}
┃ ✍️ Script : ${FONTS.script(text)}
┃ 🔢 DoubleStruck : ${FONTS.doubleStruck(text)}
┃ 💻 Monospace : ${FONTS.monospace(text)}
┃ 🔠 SmallCaps : ${FONTS.smallCaps(text)}
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`;
  } else {
    let styledText = "";
    switch(style) {
      case "bold": styledText = FONTS.bold(text); break;
      case "italic": styledText = FONTS.italic(text); break;
      case "boldItalic": styledText = FONTS.boldItalic(text); break;
      case "script": styledText = FONTS.script(text); break;
      case "doubleStruck": styledText = FONTS.doubleStruck(text); break;
      case "monospace": styledText = FONTS.monospace(text); break;
      case "smallCaps": styledText = FONTS.smallCaps(text); break;
      default: styledText = text;
    }
    
    result = `╭━〔 ✨ 𝐅𝐀𝐍𝐂𝐘 〕━⬣
┃ 🎨 Style : *${style}*
┃
┃ ${styledText}
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`;
  }

  await client.sendMessage(remoteJid, { text: result }, { quoted: message });
}
