const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
// Servir archivos estáticos de la carpeta actual
app.use(express.static(__dirname));
const TIKTOK_USERNAME = "TU_USUARIO_AQUÍ"; 
const PORT = process.env.PORT || 3000;
// 1. CONEXIÓN REAL DE TIKTOK
let tiktokConnection = new WebcastPushConnection(TIKTOK_USERNAME);
tiktokConnection.connect().then(state => {
    console.info("✅ Conectado a @" + TIKTOK_USERNAME);
}).catch(err => {
    console.warn("⚠️ TikTok Live no detectado (Modo de prueba local activo)");
});
// Escucha de regalos en vivo desde TikTok
tiktokConnection.on('gift', (data) => {
    if (data.giftType === 1 && !data.repeatEnd) return; 
    emitirRegalo(data.uniqueId, data.giftName, data.repeatCount || 1);
});
// 2. ENRUTAMIENTO DE PANTALLAS
// Ruta limpia: Muestra tu juego real (la que pones en OBS)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
// Ruta /pruebas: Muestra el panel con los botones para testear
app.get('/pruebas', (req, res) => {
    res.sendFile(__dirname + '/index-prueba.html');
});
// 3. SISTEMA DE SIMULACIÓN INTERNA
io.on('connection', (socket) => {
    // Escucha cuando haces clic en un botón del panel de pruebas
    socket.on('simular-regalo', (data) => {
        emitirRegalo(data.username, data.giftName, data.count);
    });
});
// Función única que reenvía el regalo a todas las pantallas conectadas
function emitirRegalo(username, giftName, count) {
    io.emit('new-gift', {
        username: username,
        giftName: giftName,
        count: count
    });
}
// Escuchar en el puerto asignado por Replit
server.listen(PORT, '0.0.0.0', () => {
     console.log(`🚀 Servidor Pug Chef encendido correctamente en el puerto ${PORT}`);
});
