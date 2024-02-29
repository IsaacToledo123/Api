const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

const port = 3005;

app.use(express.json());

app.use(cors());

const server = app.listen(port, () => {
  console.log(`api corriendo en el puerto ${port}`);
});

const ServerWS = new Server(server, {
  cors: {
    origin: "*",
  },
});

ServerWS.on("connection", (socket) => {
  console.log("Cliente conectado");

  socket.on("nuevoVehiculo", (vehiculo) => {
    console.log("Nuevo vehículo recibido:", vehiculo);
    // Puedes emitir eventos de vuelta al cliente si es necesario
     ServerWS.emit("nuevoVehiculo", vehiculo);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});
