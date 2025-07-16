"use client";
import { useState, useEffect } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load custom CSS
    const customLink = document.createElement('link');
    customLink.rel = 'stylesheet';
    customLink.href = '/swagger-ui-theme.css';
    document.head.appendChild(customLink);

    const fetchSwaggerSpec = async () => {
      try {
        const response = await fetch('/api/swagger');
        if (!response.ok) {
          throw new Error('Failed to fetch API specification');
        }
        const spec = await response.json();
        setSwaggerSpec(spec);
      } catch (err) {
        console.error('Error fetching swagger spec:', err);
        setError('Failed to load API specification');
      } finally {
        setLoading(false);
      }
    };

    fetchSwaggerSpec();

    // Cleanup
    return () => {
      if (customLink.parentNode) {
        customLink.parentNode.removeChild(customLink);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading Interactive API Documentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Karate Dojo API Documentation</h1>
          <p className="opacity-70 mb-4">
            Interactive API documentation with live testing capabilities. 
            Click &quot;Try it out&quot; on any endpoint to test it.
          </p>
          <div className="flex gap-4 text-sm mb-4">
            <a 
              href="/api/swagger" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              📥 Download OpenAPI JSON
            </a>
            <a 
              href="/api/info" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              ℹ️ API Info
            </a>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>How to test:</strong> Expand any endpoint below, click the blue &quot;Try it out&quot; button, 
              fill in parameters if needed, and click &quot;Execute&quot; to send real requests to the API.
            </p>
          </div>
        </div>
        
        {/* Swagger UI Component */}
        <div className="swagger-ui-wrapper">
          <SwaggerUI
            spec={swaggerSpec}
            deepLinking={true}
            tryItOutEnabled={true}
            supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            displayRequestDuration={true}
            filter={true}
            persistAuthorization={true}
            requestInterceptor={(request: any) => {
              console.log('API Request:', request);
              return request;
            }}
            responseInterceptor={(response: any) => {
              console.log('API Response:', response);
              return response;
            }}
            onComplete={() => {
              console.log('Swagger UI loaded successfully');
            }}
            onFailure={(error: any) => {
              console.error('Swagger UI error:', error);
            }}
          />
        </div>
      </div>
    </div>
  );
}
