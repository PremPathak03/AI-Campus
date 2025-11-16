import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

const Navigate = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Campus Navigation</h1>
          <p className="text-muted-foreground">Find any room or building</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search for a room or building..." className="pl-10" />
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Enter a room number or building name to get directions</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Navigate;