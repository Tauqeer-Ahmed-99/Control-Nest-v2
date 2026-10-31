"use client";
import { Show, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AccountLink() {
  return (
    <>
      <Show when="signed-out">
        <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
          <Button size="sm">Create your account</Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Button asChild size="sm">
          <Link href="/dashboard">My houses</Link>
        </Button>
        <UserButton />
      </Show>
    </>
  );
}
