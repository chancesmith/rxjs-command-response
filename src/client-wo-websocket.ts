import { Observable, Subject, from, of } from "rxjs";
import { catchError, filter, take, timeout } from "rxjs/operators";
import { CommandMessage, ResponseMessage } from "./types";

const RESPONSE_TIMEOUT_MS = 2000;

const responseSubject$ = new Subject<ResponseMessage>();
const events$ = from([
  { requestId: "request1", response: "Response 1" },
  { requestId: "request2", response: "Response 2" },
  { requestId: "request4", response: "Response 4" },
  { requestId: "request6", response: "Response 6" },
  { requestId: "request8", response: "Response 8" },
]);

function main() {
  const requestIds = [
    "request1",
    "request2",
    "request3",
    "request4",
    "request5",
    "request6",
    "request7",
    "request8",
    "request9",
    "request10",
  ];

  requestIds.forEach((requestId) => {
    sendCommand("testCommand", requestId, RESPONSE_TIMEOUT_MS).subscribe({
      next: (response) => {
        if (response) {
          console.log("Response:", response);
        } else {
          console.log("Timeout for requestId:", requestId);
        }
      },
      error: (err) => {
        console.error("Error handling response:", err);
      },
    });
  });

  // simulate events
  events$.subscribe((event) => {
    const response: ResponseMessage = {
      requestId: event.requestId,
      result: event.response,
    };
    responseSubject$.next(response);
  });
}

function sendCommand(
  command: string,
  requestId: string,
  timeoutMs: number
): Observable<ResponseMessage | null> {
  return new Observable((observer) => {
    const message: CommandMessage = { command, requestId };

    // simulating sending the command
    console.log("Sending command:", message);

    const response$ = responseSubject$.pipe(
      filter((response) => response.requestId === requestId),
      take(1),
      timeout(timeoutMs),
      catchError(() => of(null))
    );

    response$.subscribe(observer);
  });
}

function shutdown() {
  console.log("Process terminated");
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main();
