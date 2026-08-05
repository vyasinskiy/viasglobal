"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function OldPoliticaPrivacidad() {
  const router = useRouter();
  useEffect(() => { router.replace("/es/politica-privacidad"); }, [router]);
  return null;
}
