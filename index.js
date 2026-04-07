const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });
    
    sock.ev.on('connection.update', (update) => {
        if (update.qr) {
            console.log(' SCANNEZ CE QR CODE :');
            qrcode.generate(update.qr, { small: true });
        }
        if (update.connection === 'open') {
            console.log('✅ JOYBOY-BOT CONNECTÉ !');
        }
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const sender = msg.key.remoteJid;
        
        if (text === '!ping') {
            await sock.sendMessage(sender, { text: '🏓 Pong ! JOYBOY-BOT est là !' });
        }
        if (text === '!luffy') {
            await sock.sendMessage(sender, { text: '🔥 "Je vais devenir le Roi des Pirates !" 🔥' });
        }
        if (text === '!help') {
            await sock.sendMessage(sender, { text: 'Commandes : !ping, !luffy, !help' });
        }
    });
}

startBot();
