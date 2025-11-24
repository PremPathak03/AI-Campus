import { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Plus, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConversations, useMessages, useCreateConversation, useSendMessage } from "@/hooks/useChat";
import ChatMessage from "@/components/chat/ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { ChatSkeleton } from "@/components/SkeletonLoaders";

const Chat = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: conversations } = useConversations(userId);
  const { data: messages } = useMessages(currentConversationId);
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to start a conversation",
        variant: "destructive",
      });
      return;
    }

    const conversation = await createConversation.mutateAsync({
      user_id: userId,
      title: "New Conversation",
    });

    setCurrentConversationId(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentConversationId) return;

    const messageText = input;
    setInput("");

    try {
      await sendMessage.mutateAsync({
        conversationId: currentConversationId,
        message: messageText,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the library hours?",
    "Where is the canteen?",
    "How do I access university Wi-Fi?",
    "Where can I find computer labs?",
  ];

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">AI Assistant</h1>
            <p className="text-muted-foreground">Ask me anything about campus</p>
          </div>
          <Button onClick={handleNewConversation} size="sm" disabled={!userId}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <Card className="flex-1 mb-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            {!messages || messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Sparkles className="h-12 w-12 text-primary mb-4" />
                <p className="text-lg font-semibold mb-2">Start a conversation</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Ask me anything about campus facilities, hours, or services
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left h-auto py-3 px-4"
                      onClick={() => {
                        if (!currentConversationId) {
                          handleNewConversation().then(() => {
                            setInput(question);
                          });
                        } else {
                          setInput(question);
                        }
                      }}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {sendMessage.isPending && (
                  <div className="flex gap-3 p-4 bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI Campus Assistant</p>
                      <p className="text-sm text-muted-foreground">Thinking...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </Card>

        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMessage.isPending || !currentConversationId}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!input.trim() || sendMessage.isPending || !currentConversationId}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;