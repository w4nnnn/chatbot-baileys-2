import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import qrcode from 'qrcode-terminal'
import pino from 'pino'

const baileysLogger = pino({ level: 'error' }) // Logger untuk Baileys, hanya error

const appLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  },
  level: 'info' // Logger untuk aplikasi, info level
})

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    const sock = makeWASocket({
        auth: state,
        logger: baileysLogger // Menggunakan logger khusus untuk Baileys
        // printQRInTerminal: true // deprecated
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) {
            appLogger.info('QR Code ready to scan')
            qrcode.generate(qr, { small: true })
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            appLogger.warn({ shouldReconnect }, 'Connection closed')
            if (shouldReconnect) {
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            appLogger.info('Connection opened successfully')
        }
    })

    sock.ev.on('messages.upsert', async (m) => {

        for (const msg of m.messages) {
            if (!msg.key.fromMe && msg.message) {
                const sender = msg.key.remoteJid || 'unknown'
                const isGroup = sender.includes('@g.us')
                const participant = msg.key.participant || sender
                const displaySender = isGroup ? `${participant} in group ${sender}` : sender

                let messageContent = 'Unknown message type'
                if (msg.message.conversation) {
                    messageContent = msg.message.conversation
                } else if (msg.message.extendedTextMessage) {
                    messageContent = msg.message.extendedTextMessage.text || 'Extended text'
                } else if (msg.message.imageMessage) {
                    messageContent = '[Image]'
                } else if (msg.message.videoMessage) {
                    messageContent = '[Video]'
                } else if (msg.message.audioMessage) {
                    messageContent = '[Audio]'
                } else if (msg.message.documentMessage) {
                    messageContent = '[Document]'
                } else if (msg.message.stickerMessage) {
                    messageContent = '[Sticker]'
                }

                appLogger.info({ sender: displaySender, content: messageContent }, 'Incoming message')

                // Balas semua pesan dengan 'Halo!'
                appLogger.info('Sending reply: Halo!')
                await sock.sendMessage(msg.key.remoteJid!, { text: 'Halo!' })
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()