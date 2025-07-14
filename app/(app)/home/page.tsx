import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
  description: "Home Page",
};

export default function HomePage() {
  return (
    <div>
      <Link href={"/docs"}>Upload Documents</Link>
    </div>
  );
}
