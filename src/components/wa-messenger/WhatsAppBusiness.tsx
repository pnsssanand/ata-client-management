import { useState, useMemo } from 'react';
import { useClientStore } from '@/stores/clientStore';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatThread {
  phone: string;
  name: string;
  lastMessage: string;
  lastTemplateName: string;
  lastSentAt: Date;
  totalSent: number;
  totalFailed: number;
}

export function WhatsAppBusiness() {
  const messageLogs = useClientStore((state) => state.messageLogs);
  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  // Group messages by recipient phone into chat threads
  const chatThreads = useMemo(() => {
    const threadMap = new Map<string, ChatThread>();

    messageLogs.forEach((log) => {
      const existing = threadMap.get(log.recipientPhone);
      if (!existing) {
        threadMap.set(log.recipientPhone, {
          phone: log.recipientPhone,
          name: log.recipientName,
          lastMessage: `[Template: ${log.templateName}]`,
          lastTemplateName: log.templateName,
          lastSentAt: log.sentAt,
          totalSent: log.status === 'sent' ? 1 : 0,
          totalFailed: log.status === 'failed' ? 1 : 0,
        });
      } else {
        if (log.status === 'sent') existing.totalSent++;
        else existing.totalFailed++;
        if (new Date(log.sentAt) > new Date(existing.lastSentAt)) {
          existing.lastSentAt = log.sentAt;
          existing.lastMessage = `[Template: ${log.templateName}]`;
          existing.lastTemplateName = log.templateName;
          existing.name = log.recipientName || existing.name;
        }
      }
    });

    return Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.lastSentAt).getTime() - new Date(a.lastSentAt).getTime()
    );
  }, [messageLogs]);

  // Filter threads
  const filteredThreads = useMemo(() => {
    if (!search) return chatThreads;
    const q = search.toLowerCase();
    return chatThreads.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        t.lastTemplateName.toLowerCase().includes(q)
    );
  }, [chatThreads, search]);

  // Get messages for selected chat
  const selectedMessages = useMemo(() => {
    if (!selectedPhone) return [];
    return messageLogs
      .filter((l) => l.recipientPhone === selectedPhone)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }, [messageLogs, selectedPhone]);

  const selectedThread = chatThreads.find((t) => t.phone === selectedPhone);

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function getInitialColor(name: string) {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <div className="flex h-[calc(100vh-180px)] rounded-xl border bg-card overflow-hidden">
      {/* Left: Chat List */}
      <div className="w-full sm:w-80 lg:w-96 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-green-600 text-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="font-semibold text-lg">WhatsApp Business</h2>
          </div>
          <p className="text-green-100 text-xs mt-0.5">
            Sent messages via WhatsApp
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              {messageLogs.length === 0
                ? 'No messages sent yet. Use WA Messenger to send bulk messages.'
                : 'No chats match your search.'}
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.phone}
                onClick={() => setSelectedPhone(thread.phone)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-colors hover:bg-accent',
                  selectedPhone === thread.phone && 'bg-accent'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0',
                    getInitialColor(thread.name)
                  )}
                >
                  {getInitials(thread.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">
                      {thread.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {format(new Date(thread.lastSentAt), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">
                      {thread.lastMessage}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>

        {/* Stats Footer */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{chatThreads.length} conversations</span>
            <span>{messageLogs.length} messages</span>
          </div>
        </div>
      </div>

      {/* Right: Chat Detail / Empty State */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          !selectedPhone && 'hidden sm:flex'
        )}
      >
        {!selectedPhone ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/10">
            <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
              <MessageSquare className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground">
                WhatsApp Business
              </h3>
              <p className="text-sm mt-1">
                Select a conversation to view message history
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b bg-card">
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold',
                  getInitialColor(selectedThread?.name || '')
                )}
              >
                {getInitials(selectedThread?.name || '?')}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{selectedThread?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPhone}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedThread && selectedThread.totalSent > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {selectedThread.totalSent} sent
                  </Badge>
                )}
                {selectedThread && selectedThread.totalFailed > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-700"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    {selectedThread.totalFailed} failed
                  </Badge>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0iI2Y5ZmFmYiIvPjxwYXRoIGQ9Ik0wIDBoMXYxSDB6bTIgMGgxdjFIMnptMiAwaDJ2MUg0em0zIDBoMXYxSDd6bTMgMGgxdjFIMTB6bTMgMGgydjFIMTN6bTMgMGgxdjFIMTZ6IiBmaWxsPSIjZjNmNGY2Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiLz48L3N2Zz4=')]">
              <div className="p-4 space-y-3">
                {selectedMessages.map((msg) => (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      className={cn(
                        'max-w-[75%] rounded-lg px-4 py-2 shadow-sm',
                        msg.status === 'sent'
                          ? 'bg-green-100 text-green-900'
                          : 'bg-red-100 text-red-900'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {msg.templateName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(msg.sentAt), 'MMM d, h:mm a')}
                        </span>
                        {msg.status === 'sent' ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      {msg.error && (
                        <p className="text-xs text-red-500 mt-1">{msg.error}</p>
                      )}
                    </div>
                  </div>
                ))}

                {selectedMessages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No messages in this conversation.
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom info bar */}
            <div className="p-3 border-t bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Messages are sent via WA Messenger using template messages
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
