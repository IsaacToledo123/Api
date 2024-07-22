const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const https = require('https');  // Corrección de importación
const fs = require('fs');  // Corrección de importación
const app = express();
const port = 3005;
const dotenv = require('dotenv');
dotenv.config();

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

const validateData = (data, type) => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  switch(type) {
    case 'nivelAgua':
    case 'nivelFertilizante':
      return typeof data.value === 'number' && data.value >= 0 && data.value <= 100;
    case 'ph':
      return typeof data.humedad === 'number' &&
             typeof data.temperatura === 'number' &&
             typeof data.conductividad === 'number';
    case 'flujoAgua':
      return typeof data.litrosPorMinuto === 'number' &&
             typeof data.totalConsumido === 'number';
    case 'estado':
      return ['bueno', 'malo', 'excelente'].includes(data.value);
    default:
      return false;
  }
};

const checkAuthorization = (socket, data, type) => {
  return true;
};

ServerWS.on("connection", (socket) => {
  console.log("Cliente conectado");

  socket.on("nivelAgua", (data) => { // en esta cola hacer una operacion segun la cola de nivel de agua si recibe en la api un mensaje de "hay agua" significa que esta lleno ,el valor de que esta lleno es de 20l y en el misma operacion va a consumir la cola de flujoAgua l 
    if (!validateData(data, 'nivelAgua')) {
      socket.emit('error', 'Invalid data');
      return;
    }
    if (!checkAuthorization(socket, data, 'nivelAgua')) {
      socket.emit('error', 'Unauthorized');
      return;
    }
    console.log("Nuevo mensaje de nivel de agua:", data);
    ServerWS.emit("nuevo", { tipo: "nivelAgua", data });
  });

  socket.on("ph", (data) => {
    if (!validateData(data, 'ph')) {
      socket.emit('error', 'Invalid data');
      return;
    }
    if (!checkAuthorization(socket, data, 'ph')) {
      socket.emit('error', 'Unauthorized');
      return;
    }
    console.log("Nuevo mensaje de pH:", data);
    ServerWS.emit("nuevo", { tipo: "ph", data });
  });

  socket.on("flujoAgua", (data) => {
    if (!validateData(data, 'flujoAgua')) {
      socket.emit('error', 'Invalid data');
      return;
    }
    if (!checkAuthorization(socket, data, 'flujoAgua')) {
      socket.emit('error', 'Unauthorized');
      return;
    }
    console.log("Nuevo mensaje de flujo de agua:", data);
    ServerWS.emit("nuevo", { tipo: "flujoAgua", data });
  });

  socket.on("Estado de la planta", (data) => {
    if (!validateData(data, 'estado')) {
      socket.emit('error', 'Invalid data');
      return;
    }
    if (!checkAuthorization(socket, data, 'estado')) {
      socket.emit('error', 'Unauthorized');
      return;
    }
    console.log("Nuevo mensaje de estado:", data);
    ServerWS.emit("nuevo", { tipo: "estado", data });
  });

  socket.on("nivelFertilizante", (data) => {
    if (!validateData(data, 'nivelFertilizante')) {
      socket.emit('error', 'Invalid data');
      return;
    }
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
