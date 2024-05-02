import { WebSocket } from "ws";
import { Subject, Observable, of } from "rxjs";
import { catchError, filter, map, take, timeout } from "rxjs/operators";
import { PORT } from "./constants";
import { CommandMessage, ResponseMessage } from "./types";

const RECONNECT_DELAY_MS = 3000;
const RESPONSE_TIMEOUT_MS = 2000;

let ws: WebSocket | null = null;

const responseSubject$ = new Subject<ResponseMessage>();

function main() {
  ws = new WebSocket(`ws://localhost:${PORT}`);

  ws.on("open", () => {
    console.log("WebSocket connected");
    const requestId = `unique_request_id_${new Date().getTime()}`;
    sendCommand(ws!, "testCommand", requestId, RESPONSE_TIMEOUT_MS).subscribe({
      next: () => {
        handleResponse(requestId, RESPONSE_TIMEOUT_MS).subscribe({
          next: (response) => {
            console.log("Response:", response);
            ws!.close();
          },
          error: (err) => {
            console.error("Error handling response:", err);
            ws!.close();
          },
        });
      },
      error: (err) => {
        console.error("Error sending command:", err);
        ws!.close();
      },
    });
  });

  ws.on("message", (message: string) => {
    const data: ResponseMessage = JSON.parse(message);
    responseSubject$.next(data);
  });

  ws.on("close", () => {
    console.log("WebSocket closed, retrying in 3 seconds...");

    // run again
    setTimeout(main, RECONNECT_DELAY_MS);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    ws!.close();
  });
}

function sendCommand(
  ws: WebSocket,
  command: string,
  requestId: string,
  timeoutMs: number
): Observable<ResponseMessage | null> {
  return new Observable((observer) => {
    const message: CommandMessage = { command, requestId };

    ws.send(JSON.stringify(message));

    const response$ = responseSubject$.pipe(
      filter((response) => response.requestId === requestId),
      take(1),
      timeout(timeoutMs),
      catchError(() => of(null))
    );

    response$.subscribe(observer);
  });
}

function handleResponse(requestId: string, timeoutMs: number) {
  return sendCommand(ws, "testCommand", requestId, RESPONSE_TIMEOUT_MS);
}

function shutdown() {
  if (ws) {
    ws.close();
    console.log("WebSocket client closed");
    process.exit(0);
  }
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main();
