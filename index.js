const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3005;

app.use(express.json());
app.use(cors({
  origin: "https://soursop.lat",
  methods: ["GET", "POST"],
  allowedHeaders: ["Authorization"],
  credentials: true
}));

const server = app.listen(port, () => {
  console.log(`API corriendo en el puerto ${port}`);
});

const ServerWS = new Server(server, {
  cors: { 
    origin: "https://soursop.lat", 
  },
});

const jwtSecret = process.env.JWT_SECRET_KEY;

ServerWS.use((socket, next) => {
  const authHeader = socket.handshake.headers['authorization'];
  if (!authHeader) {
    return next(new Error('Authentication error'));
  }

  const token = authHeader.split(' ')[1];
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

  socket.on("nivelAgua", (data) => {
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
