"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function OldAvisoLegal() {
  const router = useRouter();
  useEffect(() => { router.replace("/es/aviso-legal"); }, [router]);
  return null;
}
