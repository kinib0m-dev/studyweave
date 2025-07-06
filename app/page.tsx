import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center">
      <Button asChild>
        <Link href={"/login"}>Login</Link>
      </Button>
    </div>
  );
}
