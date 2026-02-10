// ============================================
// SISTEMA DE CHAT
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Plus, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { getInitials } from '@/utils/helpers';
import { db } from '@/db/database';

export function Chat() {
  const { user } = useAuthStore();
  const { chatRooms, messages, activeChat, setActiveChat, fetchChatRooms, fetchMessages, createChatRoom, sendMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatRooms();
    
    const loadUsers = async () => {
      const allUsers = await db.users.where('id').notEqual(user?.id || '').toArray();
      setUsers(allUsers);
    };
    
    loadUsers();
  }, [fetchChatRooms, user?.id]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
    }
  }, [activeChat, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    await sendMessage(activeChat, newMessage);
    setNewMessage('');
  };

  const handleCreateChat = async () => {
    if (!selectedUser) return;
    
    const chatId = await createChatRoom([selectedUser]);
    if (chatId) {
      setActiveChat(chatId);
      setIsNewChatOpen(false);
      setSelectedUser('');
    }
  };

  const activeRoom = chatRooms.find((r: any) => r.id === activeChat);
  const otherParticipant = activeRoom?.participantsData?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat</h1>
          <p className="text-muted-foreground">Comunícate con profesores, estudiantes y acudientes</p>
        </div>
        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Conversación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateChat} className="w-full">
                Iniciar Chat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="h-[calc(100vh-280px)]">
        <div className="grid grid-cols-3 h-full">
          {/* Chat List */}
          <div className="border-r">
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar conversación..." className="pl-10" />
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="space-y-1 p-2">
                {chatRooms.map((room: any) => {
                  const participant = room.participantsData?.[0];
                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveChat(room.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        activeChat === room.id ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback>
                          {participant ? getInitials(participant.firstName, participant.lastName) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {participant?.firstName} {participant?.lastName}
                          </p>
                          {room.unreadCount ? (
                            <Badge variant="default" className="ml-2">
                              {room.unreadCount}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {room.lastMessage?.content || 'Sin mensajes'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Messages */}
          <div className="col-span-2 flex flex-col">
            {activeChat && otherParticipant ? (
              <>
                <CardHeader className="border-b py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(otherParticipant.firstName, otherParticipant.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {otherParticipant.firstName} {otherParticipant.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {otherParticipant.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg: any) => {
                      const isOwn = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <CardContent className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">Selecciona una conversación</p>
                  <p className="text-sm">Elige un chat para comenzar a mensajear</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
