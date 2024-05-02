export interface CommandMessage {
  requestId: string;
  command: string;
}

export interface ResponseMessage {
  requestId: string;
  result: string;
}
