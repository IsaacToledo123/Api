const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const port = 3005;

app.use(express.json());
app.use(cors());

const server = app.listen(port, () => {
  console.log(`API corriendo en el puerto ${port}`);
});

const ServerWS = new Server(server, {
  cors: { 
    origin: "*",
  },
});

ServerWS.on("connection", (socket) => {
  console.log("Cliente conectado");

  // Escucha eventos específicos para cada tipo de mensaje
  socket.on("nivelAgua", (data) => {
    console.log("Nuevo mensaje de nivel de agua:", data);
    // Puedes realizar acciones específicas con los datos aquí
    ServerWS.emit("nuevo", { tipo: "nivelAgua", data });
  });

  socket.on("ph", (data) => {
    console.log("Nuevo mensaje de pH:", data);
    // Puedes realizar acciones específicas con los datos aquí
    ServerWS.emit("nuevo", { tipo: "ph", data });
  });

  socket.on("flujoAgua", (data) => {
    console.log("Nuevo mensaje de flujo de agua:", data);
  
    ServerWS.emit("nuevo", { tipo: "flujoAgua", data });
  });

  socket.on("nivelFertilizante", (data) => {
    console.log("Nuevo mensaje de nivel de fertilizante:", data);
 
    ServerWS.emit("nuevo", { tipo: "nivelFertilizante", data });
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});
