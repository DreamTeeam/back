import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './tenant-aware-chat.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  data: {
    tenantSlug: string;
    userId: string;
    userName?: string;
  };
}

@WebSocketGateway(8080, {
  cors: {
    origin: '*', //'http://localhost:4000',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly configService: ConfigService, // NACHO
  ) {}

  afterInit(server: Server) {
    this.logger.log('Iniciando chat👩‍💻');
  }

  async handleConnection(client: AuthenticatedSocket) {
    const tenantSlug = client.handshake.auth?.tenantSlug; //aca leemos el payload de auth para obtener el token
    const token = client.handshake.auth?.token;

    if (!tenantSlug || !token) {
      this.logger.error('Conexión rechazada: No se proporcionó tenantSlug.');
      return client.disconnect(true);
    }

    const isValidTenant = await this.chatService.validateTenant(tenantSlug); // validamos con el servicio el tenant
    if (!isValidTenant) {
      this.logger.error(
        `Conexión rechazada: usuario inválido '${tenantSlug}'.`,
      );
      client.disconnect(true);
      return;
    }

    //NACHO
    // const cookies = client.handshake.headers.cookie;
    // const token1 = this.extractTokenFromCookie(cookies);

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') || 'jwtsecurity';
      const payload = jwt.verify(token, secret) as {
        //aca verifico que el token sea valido
        sub: string;
        name: string;
      };

      client.data.userId = payload.sub;
      client.data.userName = payload.name;
      client.data.tenantSlug = tenantSlug;

      this.logger.log(
        `Usuario conectado: ${client.id} (User: ${payload.name}, ID: ${payload.sub}) al tenant: ${tenantSlug}`,
      );
    } catch (err) {
      this.logger.error('Token inválido en conexión WebSocket.');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.data.tenantSlug) {
      this.logger.log(
        `Usuario desconectado: ${client.data.userName || client.id} del db: ${client.data.tenantSlug}`,
      );
    } else {
      this.logger.log(
        `Usuario desconectado: ${client.id} (sin tenant asignado)`,
      );
    }
  }

  private getTenantRoomName(tenantSlug: string, room: string): string {
    return `${tenantSlug}__${room}`;
  }

  private extractTokenFromCookie(cookieHeader?: string): string {
    if (!cookieHeader) return '';
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith('access_token='));
    return tokenCookie?.split('=')[1] || '';
  }

  @SubscribeMessage('event_join')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    const tenantSlug = client.handshake.auth?.tenantSlug;
    const tenantRoom = this.getTenantRoomName(tenantSlug, room);

    this.logger.log(
      `Cliente ${client.data.userName || client.id} uniéndose a la sala ${tenantRoom}`,
    );
    client.join(tenantRoom);
  }

  @SubscribeMessage('event_message')
  handleIncommingMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { room: string; message: string },
  ) {
    const tenantSlug = client.handshake.auth?.tenantSlug;
    const { room, message } = payload;
    const tenantRoom = this.getTenantRoomName(tenantSlug, room);

    this.logger.log(
      `Retransmitiendo mensaje de '${client.data.userName}' a la sala ${tenantRoom}`,
    );

    client.to(tenantRoom).emit('new_message', {
      user: client.data.userName || client.data.userId,
      message: message,
      createdAt: new Date(),
    });
  }

  @SubscribeMessage('event_leave')
  handleRoomLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    const tenantSlug = client.handshake.auth?.tenantSlug;

    const tenantRoom = this.getTenantRoomName(tenantSlug, room);

    this.logger.log(`Cliente ${client.id} abandonando la sala ${tenantRoom}`);

    client.leave(tenantRoom);
    this.server.to(tenantRoom).emit('user_left', {
      user: client.id,
      message: `El usuario ${client.id.substring(0, 5)} se ha ido.`,
    });
  }
}
