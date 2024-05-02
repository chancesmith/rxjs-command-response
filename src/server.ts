import WebSocket from "ws";
import { PORT } from "./constants";
import { CommandMessage, ResponseMessage } from "./types";

const DELAY_MS = 1000;

const wss = new WebSocket.Server({ port: PORT });

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (message: string) => {
    const { requestId, command }: CommandMessage = JSON.parse(message);

    // 1. processing and response to commands
    setTimeout(() => {
      const randomNumber = Math.random();

      // 2. only send 20% of the responses back
      if (randomNumber < 0.2) {
        const response: ResponseMessage = {
          requestId,
          result: `Result for ${command}`,
        };
        ws.send(JSON.stringify(response));
      }
    }, DELAY_MS);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);

// teardown
function shutdown() {
  console.log("Shutting down WebSocket server...");
  wss.close(() => {
    console.log("WebSocket server closed");
    process.exit(0);
  });

  // force terminate remaining connections after delay
  setTimeout(() => {
    console.warn("Forcefully terminating WebSocket server...");
    process.exit(1);
  }, 5000).unref(); // prevent timer from keeping the event loop going
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
