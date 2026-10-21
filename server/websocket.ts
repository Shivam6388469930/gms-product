import { WebSocketServer, WebSocket } from "ws";
import { connectDB } from "../config/db";

const PORT = 4001;

const wss = new WebSocketServer({
  port: PORT,
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", async (ws: WebSocket) => {
  console.log("Client connected");

  try {
    await connectDB();

    ws.send(
      JSON.stringify({
        type: "connected",
        message: "WebSocket connected successfully",
      })
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);

    ws.send(
      JSON.stringify({
        type: "error",
        message: "Database connection failed",
      })
    );
  }

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      console.log("Received:", data);

      // Example response
      ws.send(
        JSON.stringify({
          type: "response",
          data,
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});