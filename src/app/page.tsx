import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen p-8">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 py-16 px-6 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm border sm:items-start">
        <div className="flex items-center gap-3">
          <Image
            className="dark:invert h-6 w-[120px]"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={24}
            priority
          />
          <Badge variant="secondary">shadcn/ui</Badge>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Welcome to Checkpoint</CardTitle>
            <CardDescription>
              Next.js App Router deployed on Cloudflare Workers via OpenNext
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
