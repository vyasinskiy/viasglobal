"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function OldPoliticaCookies() {
  const router = useRouter();
  useEffect(() => { router.replace("/es/politica-cookies"); }, [router]);
  return null;
}
