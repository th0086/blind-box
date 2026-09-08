import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class BroadcastGateway {
  private readonly retentionMs = 60_000;
  private readonly recentWinners: Array<{ message: string; timestamp: string }> = [];

  @WebSocketServer()
  server!: Server;

  emitWinner(message: string): void {
    const timestamp = new Date().toISOString();
    this.recentWinners.unshift({ message, timestamp });
    this.pruneExpired();
    this.server.emit('newWinner', { message, timestamp });
  }

  getRecentWinners(): Array<{ message: string; timestamp: string }> {
    this.pruneExpired();
    return [...this.recentWinners];
  }

  private pruneExpired(): void {
    const cutoff = Date.now() - this.retentionMs;
    let index = 0;
    while (index < this.recentWinners.length) {
      const itemTime = new Date(this.recentWinners[index].timestamp).getTime();
      if (itemTime >= cutoff) {
        index += 1;
      } else {
        this.recentWinners.splice(index, 1);
      }
    }
  }
}
