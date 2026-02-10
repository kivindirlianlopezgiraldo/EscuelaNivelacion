// ============================================
// HOOK DE CHAT
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { db } from '@/db/database';
import { useAuthStore } from '@/store';
import type { ChatMessage, ChatRoom, User } from '@/types';

interface ChatRoomWithDetails extends ChatRoom {
  participantsData?: User[];
  unreadCount?: number;
}

interface MessageWithSender extends ChatMessage {
  sender?: User;
}

export function useChat() {
  const { user } = useAuthStore();
  const [chatRooms, setChatRooms] = useState<ChatRoomWithDetails[]>([]);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChatRooms = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const rooms = await db.chatRooms
        .where('participants')
        .equals(user.id)
        .toArray();

      const enrichedRooms = await Promise.all(
        rooms.map(async (room: ChatRoom) => {
          const participantsData = await db.users
            .where('id')
            .anyOf(room.participants)
            .toArray();

          const unreadCount = await db.chatMessages
            .where({ chatRoomId: room.id, isRead: false })
            .count();

          return {
            ...room,
            participantsData: participantsData.filter((p: User) => p.id !== user.id),
            unreadCount
          };
        })
      );

      setChatRooms(enrichedRooms);
    } catch (err) {
      setError('Error al cargar chats');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (chatRoomId: string) => {
    setLoading(true);
    try {
      const msgs = await db.chatMessages
        .where('chatRoomId')
        .equals(chatRoomId)
        .sortBy('timestamp');

      const enrichedMessages = await Promise.all(
        msgs.map(async (msg: ChatMessage) => {
          const sender = await db.users.get(msg.senderId);
          return { ...msg, sender };
        })
      );

      setMessages(enrichedMessages);

      // Marcar mensajes como leídos
      const unreadMsgs = msgs.filter((m: ChatMessage) => !m.isRead && m.senderId !== user?.id);
      for (const msg of unreadMsgs) {
        await db.chatMessages.update(msg.id, { isRead: true });
      }
    } catch (err) {
      setError('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createChatRoom = useCallback(async (
    participantIds: string[],
    type: 'private' | 'group' = 'private',
    name?: string
  ): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);

    try {
      // Verificar si ya existe un chat privado
      if (type === 'private' && participantIds.length === 1) {
        const existing = await db.chatRooms
          .where('participants')
          .equals(user.id)
          .filter((r: ChatRoom) => 
            r.type === 'private' && 
            r.participants.includes(participantIds[0])
          )
          .first();

        if (existing) {
          return existing.id;
        }
      }

      const newRoom: ChatRoom = {
        id: crypto.randomUUID(),
        name,
        participants: [user.id, ...participantIds],
        type,
        createdAt: new Date()
      };

      await db.chatRooms.add(newRoom);
      await fetchChatRooms();
      return newRoom.id;
    } catch (err) {
      setError('Error al crear chat');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchChatRooms]);

  const sendMessage = useCallback(async (
    chatRoomId: string,
    content: string
  ): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: user.id,
        receiverId: '',
        content,
        timestamp: new Date(),
        isRead: false,
        chatRoomId
      };

      await db.chatMessages.add(newMessage);

      // Actualizar lastMessage del chat room
      await db.chatRooms.update(chatRoomId, {
        lastMessage: newMessage
      });

      // Crear notificación para los otros participantes
      const room = await db.chatRooms.get(chatRoomId);
      if (room) {
        for (const participantId of room.participants) {
          if (participantId !== user.id) {
            await db.notifications.add({
              id: crypto.randomUUID(),
              userId: participantId,
              title: 'Nuevo mensaje',
              message: `${user.firstName}: ${content.substring(0, 50)}...`,
              type: 'message',
              isRead: false,
              createdAt: new Date()
            });
          }
        }
      }

      await fetchMessages(chatRoomId);
      return true;
    } catch (err) {
      setError('Error al enviar mensaje');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchMessages]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await db.chatMessages.delete(messageId);
      if (activeChat) {
        await fetchMessages(activeChat);
      }
      return true;
    } catch (err) {
      setError('Error al eliminar mensaje');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeChat, fetchMessages]);

  const getUnreadCount = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    return await db.chatMessages
      .where({ receiverId: user.id, isRead: false })
      .count();
  }, [user]);

  // Polling para nuevos mensajes
  useEffect(() => {
    if (!activeChat) return;

    const interval = setInterval(() => {
      fetchMessages(activeChat);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeChat, fetchMessages]);

  return {
    chatRooms,
    messages,
    activeChat,
    loading,
    error,
    setActiveChat,
    fetchChatRooms,
    fetchMessages,
    createChatRoom,
    sendMessage,
    deleteMessage,
    getUnreadCount
  };
}
