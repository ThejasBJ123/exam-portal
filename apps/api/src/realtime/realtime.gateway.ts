import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true },
  namespace: "/realtime",
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage("join-exam")
  join(@MessageBody() examId: string, @ConnectedSocket() client: Socket) {
    void client.join(`exam:${examId}`);
    return { ok: true };
  }

  sessionUpdated(examId: string, payload: unknown) {
    this.server.to(`exam:${examId}`).emit("session-updated", payload);
  }

  warningRaised(examId: string, payload: unknown) {
    this.server.to(`exam:${examId}`).emit("warning-raised", payload);
  }
}
