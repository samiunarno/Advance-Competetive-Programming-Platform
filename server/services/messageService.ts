import { Message } from '../models/Message.ts';

export class MessageService {
  async getMessages(userId: string) {
    return Message.find({ user_id: userId }).sort({ created_at: 1 });
  }

  async sendMessage(userId: string, sender: 'user' | 'admin', content: string) {
    const message = new Message({ user_id: userId, sender, content });
    await message.save();
    return message;
  }

  async getAllConversations() {
    return Message.aggregate([
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: '$user_id',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$user.username',
          email: '$user.email',
          avatar: '$user.avatar',
          lastMessage: '$lastMessage.content',
          lastMessageDate: '$lastMessage.created_at',
          unreadCount: 1
        }
      },
      { $sort: { lastMessageDate: -1 } }
    ]);
  }

  async markAsRead(userId: string, reader: 'admin' | 'user') {
    const sender = reader === 'admin' ? 'user' : 'admin';
    await Message.updateMany(
      { user_id: userId, sender: sender, read: false },
      { $set: { read: true } }
    );
  }
}

export const messageService = new MessageService();
