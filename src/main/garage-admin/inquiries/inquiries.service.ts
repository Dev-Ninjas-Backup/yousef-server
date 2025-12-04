import { Injectable } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all UNREAD private messages sent TO the garage owner
   * → Excludes messages sent BY the garage owner
   * → Includes sender full info + message content + timestamp
   */
  @HandleError('Failed to fetch customer inquiries', 'INQUIRIES')
  async getCustomerInquiries(userId: string) {
    const unreadMessages = await this.prisma.privateMessage.findMany({
      where: {
        //  Message must be in a conversation involving the garage owner
        conversation: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        // Message must NOT be sent by the garage owner
        senderId: {
          not: userId,
        },

        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
            email: true,
            phone: true,
          },
        },
        conversation: {
          select: {
            id: true,
            user1Id: true,
            user2Id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return unreadMessages.map((msg) => ({
      messageId: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      files: msg.files || [],
      createdAt: msg.createdAt,

      sender: {
        id: msg.sender.id,
        fullName: msg.sender.fullName ?? 'Unknown User',
        profilePhoto: msg.sender.profilePhoto,
        email: msg.sender.email,
        phone: msg.sender.phone,
        isGarageOwner: msg.conversation.user1Id === userId,
      },

      customerId: msg.sender.id,
    }));
  }

  // ------------------------ get custom inquiries messages ----------------
  @HandleError('Failed to fetch custom inquiries', 'INQUIRIES')
  async getCustomInquiries(userId: string) {
    return this.prisma.contact.findMany({
      where: {
        garageOwnerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        email: true,
        subject: true,
        message: true,
        createdAt: true,
        messages: {
          where: {
            isForGrageAdmin: true,
          },
          orderBy: { createdAt: 'asc' },
          select: {
            content: true,
            isFromAdmin: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
