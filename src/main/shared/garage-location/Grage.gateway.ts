// src/garage-location/gateway/garage-location.gateway.ts

import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { LocationGarageService } from './service/locaticon.garage.service';


interface LocationUpdateDto {
  userLat: number;
  userLng: number;
  radius?: number;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/garage-location',
})
export class GarageLocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger(GarageLocationGateway.name);

  constructor(
    private prisma: PrismaService,
    private locationService: LocationGarageService,
  ) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: 'Real-time garage tracking active' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(@ConnectedSocket() client: Socket, @MessageBody() data: LocationUpdateDto) {
    const { userLat, userLng, radius = 10 } = data;

    if (
      typeof userLat !== 'number' || typeof userLng !== 'number' ||
      userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180 ||
      radius < 1 || radius > 100
    ) {
      return client.emit('error', { message: 'Invalid location or radius' });
    }

    try {
      const result = await this.locationService.findNearbyGarages({
        lat: userLat,
        lng: userLng,
        radius,
      });
console.log('location result',result)
      client.emit('nearbyGarages', {
        ...result,
        userLocation: { lat: userLat, lng: userLng },
        radius,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error fetching nearby garages:', error);
      client.emit('error', { message: 'Failed to load nearby garages' });
    }
  }
}