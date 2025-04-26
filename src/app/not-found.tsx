"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
    }, 3000); // 3 seconds
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)",
      padding: 24,
    }}>
      <Image
        src="/globe.svg"
        alt="Not Found Illustration"
        width={180}
        height={180}
        style={{ marginBottom: 32 }}
      />
      <h1 style={{
        fontSize: 48,
        fontWeight: 800,
        color: "#1e293b",
        marginBottom: 8,
        letterSpacing: -2,
      }}>404</h1>
      <h2 style={{
        fontSize: 28,
        fontWeight: 600,
        color: "#334155",
        marginBottom: 16,
      }}>Page Not Found</h2>
      <p style={{
        fontSize: 18,
        color: "#64748b",
        marginBottom: 32,
      }}>
        Sorry, the page you are looking for does not exist.<br />
        You will be redirected to the home page shortly.
      </p>
      <button
        onClick={() => router.replace("/")}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 32px",
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(37,99,235,0.08)",
          transition: "background 0.2s",
        }}
      >
        Go to Home
      </button>
    </div>
  );
}
