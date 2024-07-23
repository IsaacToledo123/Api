const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const https = require('https');
const fs = require('fs');
const app = express();
const port = 3005;

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/wss.soursop.lat/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/wss.soursop.lat/fullchain.pem')
};

app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ["GET", "POST"],
  allowedHeaders: ["Authorization"],
  credentials: true
}));

// Crear servidor HTTPS
const server = https.createServer(options, app);

// Iniciar servidor HTTPS
server.listen(port, () => {
  console.log(`API corriendo en el puerto ${port}`);
});

// Configurar Socket.IO para usar el servidor HTTPS
const ServerWS = new Server(server, {
  cors: { 
    origin: "*", 
  },
});

const jwtSecret = process.env.JWT_SECRET_KEY;
console.log('JWT Secret:', jwtSecret); 

ServerWS.use((socket, next) => {
  const token = socket.handshake.headers['authorization']?.split(' ')[1];
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.error("JWT verification error:", err);
      return next(new Error('Authentication error'));
    }
    socket.decoded = decoded;
    next();
  });
});

// Simplified event handling without validation or authorization
ServerWS.on("connection", (socket) => {
  console.log("Cliente conectado");

  socket.on("nivelAgua", (data) => {
    console.log("Nuevo mensaje de nivel de agua:", data);
    ServerWS.emit("nuevo", { tipo: "nivelAgua", data });
  });

  socket.on("ph", (data) => {
    console.log("Nuevo mensaje de pH:", data);
    ServerWS.emit("nuevo", { tipo: "ph", data });
  });

  socket.on("flujoAgua", (data) => {
    console.log("Nuevo mensaje de flujo de agua:", data);
    ServerWS.emit("nuevo", { tipo: "flujoAgua", data });
  });

  socket.on("Estado de la planta", (data) => {
    console.log("Nuevo mensaje de estado:", data);
    ServerWS.emit("nuevo", { tipo: "estado", data });
  });

  socket.on("nivelFertilizante", (data) => {
    console.log("Nuevo mensaje de nivel de fertilizante:", data);
    ServerWS.emit("nuevo", { tipo: "nivelFertilizante", data });
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});
