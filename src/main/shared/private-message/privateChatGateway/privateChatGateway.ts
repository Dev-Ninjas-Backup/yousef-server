import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { SendPrivateMessageDto } from './../dto/privateChatGateway.dto';

import * as jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { ENVEnum } from 'src/common/enum/env.enum';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { PrivateChatService } from '../service/private-message.service';

enum PrivateChatEvents {
  ERROR = 'private:error',
  SUCCESS = 'private:success',
  NEW_MESSAGE = 'private:new_message',
  SEND_MESSAGE = 'private:send_message',
  NEW_CONVERSATION = 'private:new_conversation',
  CONVERSATION_LIST = 'private:conversation_list',
  LOAD_CONVERSATIONS = 'private:load_conversations',
  LOAD_SINGLE_CONVERSATION = 'private:load_single_conversation',
  TYPING_STOP = 'private:typing_stop',
  USER_STOP_TYPING = 'private:user_stop_typing',
  TYPING_START = 'private:typing_start',
  USER_TYPING = 'private:user_typing',
  MARK_AS_READ = 'private:mark_as_read',
  MESSAGE_READ = 'private:message_read',
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/pv/message',
})
export class PrivateChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PrivateChatGateway.name);

  constructor(
    private readonly privateChatService: PrivateChatService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log(
      'Socket.IO server initialized FOR PRIVATE CHAT',
      server.adapter.name,
    );
  }

  /** Handle socket connection and authentication */
  async handleConnection(client: Socket) {
    const authHeader =
      client.handshake.headers.authorization || client.handshake.auth?.token;
    if (!authHeader) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Missing authorization header',
      });
      client.disconnect(true);
      this.logger.warn('Missing auth header');
      return;
    }

    const token = authHeader.split(' ')[1];
    console.log('the connected token is', token);
    if (!token) {
      client.emit(PrivateChatEvents.ERROR, { message: 'Missing token' });
      client.disconnect(true);
      this.logger.warn('Missing token');
      return;
    }

    try {
      const jwtSecret = this.configService.get<string>(ENVEnum.JWT_SECRET);
      const payload: any = jwt.verify(token, jwtSecret as string);
      const userId = payload.sub;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });
      if (!user) {
        client.emit(PrivateChatEvents.ERROR, {
          message: 'User not found in database',
        });
        client.disconnect(true);
        this.logger.warn(`User not found: ${userId}`);
        return;
      }

      client.data.userId = userId;
      client.join(userId);
      client.emit(PrivateChatEvents.SUCCESS, userId);
      this.logger.log(
        `Private chat: User ${userId} connected, socket ${client.id}`,
      );

      // Broadcast online status to all users
      this.server.emit('private:user_status', {
        userId,
        isOnline: true,
      });
    } catch (err) {
      client.emit(PrivateChatEvents.ERROR, { message: err.message });
      client.disconnect(true);
      this.logger.warn(`Authentication failed: ${err.message}`);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      try {
        // Check if there are other active sockets for this user
        const socketsInRoom = await this.server.in(userId).fetchSockets();
        const otherSockets = socketsInRoom.filter((s) => s.id !== client.id);

        if (otherSockets.length === 0) {
          // Broadcast offline status only if no other socket is connected
          this.server.emit('private:user_status', {
            userId,
            isOnline: false,
          });
        }
      } catch (err) {
        this.logger.error(
          `Error in handleDisconnect status check: ${err.message}`,
        );
      }
      client.leave(userId);
    }
    client.emit(PrivateChatEvents.ERROR, { message: 'Disconnected' });
    this.logger.log(`Private chat disconnected: ${client.id}`);
  }

  @SubscribeMessage('private:get_user_status')
  async handleGetUserStatus(
    @MessageBody() recipientId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const socketsInRoom = await this.server.in(recipientId).fetchSockets();
      const isOnline = socketsInRoom.length > 0;
      client.emit('private:user_status', {
        userId: recipientId,
        isOnline,
      });
    } catch (err) {
      this.logger.error(`Error in handleGetUserStatus: ${err.message}`);
      client.emit('private:user_status', {
        userId: recipientId,
        isOnline: false,
      });
    }
  }

  /** Load all conversations for the connected user */
  @SubscribeMessage(PrivateChatEvents.LOAD_CONVERSATIONS)
  async handleLoadConversations(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'User not authenticated',
      });
      client.disconnect(true);
      this.logger.log('User not authenticated');
      return;
    }

    const conversations =
      await this.privateChatService.getUserConversations(userId);
    client.emit(PrivateChatEvents.CONVERSATION_LIST, conversations);
  }

  /** Load a single conversation */
  @SubscribeMessage(PrivateChatEvents.LOAD_SINGLE_CONVERSATION)
  async handleLoadSingleConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'User not authenticated',
      });
      client.disconnect(true);
      this.logger.log('User not authenticated');
      return;
    }

    const conversation =
      await this.privateChatService.getPrivateConversationWithMessages(
        conversationId,
        userId,
      );
    client.emit(PrivateChatEvents.NEW_CONVERSATION, conversation);
  }

  /** Send a message (create conversation if new) */
  @SubscribeMessage(PrivateChatEvents.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() payload: SendPrivateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { recipientId } = payload;

    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    // Validate sender matches token
    if (client.data.userId !== userId) {
      client.emit(PrivateChatEvents.ERROR, { message: 'User ID mismatch' });
      this.logger.warn(
        `User ID mismatch: client ${client.data.userId} vs payload ${userId}`,
      );
      return;
    }

    // Prevent sending message to yourself
    if (userId === recipientId) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Cannot send message to yourself',
      });
      this.logger.log(`User ${userId} cannot send message to themselves`);
      return;
    }

    // Find existing conversation
    let conversation = await this.privateChatService.findConversation(
      userId,
      recipientId,
    );

    let isNewConversation = false;
    if (!conversation) {
      conversation = await this.privateChatService.createConversation(
        userId,
        recipientId,
      );
      isNewConversation = true;
    }

    // Send message
    const message = await this.privateChatService.sendPrivateMessage(
      conversation.id,
      userId,
      payload,
    );

    // Emit new message to both users
    this.server.to(userId).emit(PrivateChatEvents.NEW_MESSAGE, message);
    this.server.to(recipientId).emit(PrivateChatEvents.NEW_MESSAGE, message);

    if (isNewConversation) {
      const senderConversations =
        await this.privateChatService.getUserConversations(userId);
      const recipientConversations =
        await this.privateChatService.getUserConversations(recipientId);

      this.server
        .to(userId)
        .emit(PrivateChatEvents.NEW_CONVERSATION, senderConversations);
      this.server
        .to(recipientId)
        .emit(PrivateChatEvents.NEW_CONVERSATION, recipientConversations);
    }
  }

  /** Helper for external services to emit new messages */
  emitNewMessage(userId: string, message: any) {
    this.server.to(userId).emit(PrivateChatEvents.NEW_MESSAGE, message);
  }

  @SubscribeMessage(PrivateChatEvents.TYPING_START)
  async handleTypingStart(
    @MessageBody() data: { conversationId: string; recipientId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    this.server.to(data.recipientId).emit(PrivateChatEvents.TYPING_START, {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage(PrivateChatEvents.TYPING_STOP)
  async handleTypingStop(
    @MessageBody() data: { conversationId: string; recipientId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    this.server.to(data.recipientId).emit(PrivateChatEvents.TYPING_STOP, {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage(PrivateChatEvents.MARK_AS_READ)
  async handleMarkAsRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      const message = await this.prisma.privateMessage.findUnique({
        where: { id: data.messageId },
        include: { conversation: true },
      });

      if (message) {
        // Mark read in DB
        await this.privateChatService.makePrivateMassageReadTrue(
          data.messageId,
        );

        // Find recipient (the original sender of the message)
        const originalSenderId = message.senderId;

        // Emit message read event to the original sender
        this.server.to(originalSenderId).emit(PrivateChatEvents.MESSAGE_READ, {
          messageId: data.messageId,
          conversationId: message.conversationId,
        });
      }
    } catch (err) {
      this.logger.error(`Error in handleMarkAsRead: ${err.message}`);
    }
  }

  private getUserIdFromSocket(client: Socket): string | null {
    const userId = client.data?.userId;
    if (!userId) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'User not authenticated',
      });
      this.logger.warn('User ID not found in socket client');
      client.disconnect(true);
      return null;
    }
    return userId;
  }
}
