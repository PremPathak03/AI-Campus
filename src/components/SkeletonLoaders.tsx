import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ClassCardSkeleton = () => (
  <Card className="animate-fade-in">
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </CardContent>
  </Card>
);

export const DashboardSkeleton = () => (
  <div className="container max-w-4xl mx-auto p-4 space-y-6 pb-24 animate-fade-in">
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>

    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>

    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Skeleton className="h-12 w-12 rounded-full mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const ChatSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    {[1, 2, 3].map((i) => (
      <div key={i} className={i % 2 === 0 ? "flex justify-end" : "flex justify-start"}>
        <div className={`max-w-[80%] rounded-lg p-4 ${i % 2 === 0 ? "bg-primary" : "bg-muted"}`}>
          <Skeleton className="h-4 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    ))}
  </div>
);

export const NavigateSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    <Skeleton className="h-10 w-full rounded-lg" />
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
