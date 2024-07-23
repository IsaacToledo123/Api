const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const https = require('https');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = 3005;

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/wss.soursop.lat/privkey.pem'),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/wss.soursop.lat/fullchain.pem')
};

app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ["GET", "POST"],
  allowedHeaders: ["Authorization"],
  credentials: true
}));

const server = https.createServer(options, app);

server.listen(port, () => {
  console.log(`API corriendo en el puerto ${port}`);
});

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

const checkAuthorization = (socket, data, type) => {
  return true;
};

ServerWS.on("connection", (socket) => {
  console.log("Cliente conectado");

  socket.on("nivelAgua", (data) => {
    if (!checkAuthorization(socket, data, 'nivelAgua')) {
      socket.emit('error', 'Unauthorized');
      return;
    }
    console.log("Nuevo mensaje de nivel de agua:", data);
    ServerWS.emit("nuevo", { tipo: "nivelAgua", data });
  });

  socket.on("ph", (data) => {
    if (!checkAuthorization(socket, data, 'ph')) {
      socket.emit('error', 'Unauthorized');
      return;
    }
    console.log("Nuevo mensaje de pH:", data);
    ServerWS.emit("nuevo", { tipo: "ph", data });
  });

  socket.on("flujoAgua", (data) => {
    if (!checkAuthorization(socket, data, 'flujoAgua')) {
      socket.emit('error', 'Unauthorized');
      return;
    }
    console.log("Nuevo mensaje de flujo de agua:", data);
    ServerWS.emit("nuevo", { tipo: "flujoAgua", data });
  });

  socket.on("estado", (data) => {
    if (!checkAuthorization(socket, data, 'estado')) {
      socket.emit('error', 'Unauthorized');
      return;
    }
    console.log("Nuevo mensaje de estado:", data);
    ServerWS.emit("nuevo", { tipo: "estado", data });
  });

  socket.on("nivelFertilizante", (data) => {
    if (!checkAuthorization(socket, data, 'nivelFertilizante')) {
      socket.emit('error', 'Unauthorized');
      return;
    }
    console.log("Nuevo mensaje de nivel de fertilizante:", data);
    ServerWS.emit("nuevo", { tipo: "nivelFertilizante", data });
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});
