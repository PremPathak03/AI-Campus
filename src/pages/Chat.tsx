import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";

const Chat = () => {
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">Ask me anything about campus</p>
        </div>

        <Card className="flex-1 mb-4 p-4 overflow-auto">
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Start a conversation...</p>
          </div>
        </Card>

        <div className="flex gap-2">
          <Input placeholder="Type your message..." />
          <Button size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;