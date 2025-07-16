"use client";
import { useEffect } from "react";

export default function SwaggerDocsPage() {
  useEffect(() => {
    // Redirect to the native Swagger UI
    window.location.href = '/docs/api';
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="text-lg mb-4">Redirecting to Interactive API Documentation...</div>
        <div className="text-sm opacity-60">
          If you&apos;re not redirected automatically, 
          <a href="/docs/api" className="text-blue-600 hover:text-blue-800 ml-1">
            click here
          </a>
        </div>
      </div>
    </div>
  );
}
