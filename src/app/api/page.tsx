"use client";
import { useState, useEffect } from "react";

export default function SwaggerDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/swagger")
      .then(res => res.json())
      .then(data => {
        setSwaggerSpec(data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load API documentation");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading API Documentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {swaggerSpec?.info?.title || "API Documentation"}
            </h1>
            <p className="text-gray-600 mb-4">
              {swaggerSpec?.info?.description || "REST API Documentation"}
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Version: {swaggerSpec?.info?.version}</span>
              <span>•</span>
              <span>Contact: {swaggerSpec?.info?.contact?.email}</span>
            </div>
          </div>

          {/* Authentication */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Authentication</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                This API uses session-based authentication with NextAuth. 
                Include your session token in the cookie header for authenticated requests.
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">API Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {swaggerSpec?.tags?.map((tag: any) => (
                <div key={tag.name} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{tag.name}</h3>
                  <p className="text-sm text-gray-600">{tag.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Endpoints */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>
            <div className="space-y-6">
              {Object.entries(swaggerSpec?.paths || {}).map(([path, methods]: [string, any]) => (
                <div key={path} className="border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">{path}</h3>
                  <div className="space-y-4">
                    {Object.entries(methods).map(([method, details]: [string, any]) => (
                      <div key={method} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            method === 'get' ? 'bg-green-100 text-green-800' :
                            method === 'post' ? 'bg-blue-100 text-blue-800' :
                            method === 'put' ? 'bg-yellow-100 text-yellow-800' :
                            method === 'delete' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {method}
                          </span>
                          <span className="font-semibold">{details.summary}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{details.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          {details.tags?.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {details.security && (
                          <div className="mt-2">
                            <span className="text-xs text-orange-600">🔒 Authentication required</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schemas */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Data Models</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(swaggerSpec?.components?.schemas || {}).map(([name, schema]: [string, any]) => (
                <div key={name} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{name}</h3>
                  <div className="text-sm text-gray-600">
                    <div className="mb-2">Type: {schema.type}</div>
                    {schema.required && (
                      <div className="mb-2">
                        Required: {schema.required.join(", ")}
                      </div>
                    )}
                    <div className="space-y-1">
                      {Object.entries(schema.properties || {}).map(([prop, details]: [string, any]) => (
                        <div key={prop} className="flex justify-between">
                          <span className="font-mono text-xs">{prop}</span>
                          <span className="text-xs text-gray-500">{details.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Codes */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Response Codes</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-green-700">Success</h4>
                  <div className="space-y-1">
                    <div>200 - OK</div>
                    <div>201 - Created</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700">Error</h4>
                  <div className="space-y-1">
                    <div>400 - Bad Request</div>
                    <div>401 - Unauthorized</div>
                    <div>403 - Forbidden</div>
                    <div>404 - Not Found</div>
                    <div>409 - Conflict</div>
                    <div>500 - Internal Server Error</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Swagger JSON */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Raw Swagger JSON</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>{JSON.stringify(swaggerSpec, null, 2)}</code>
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>
                <a href="/api/swagger" className="text-blue-600 hover:text-blue-800">
                  Download JSON
                </a>
              </div>
              <div>
                Generated on {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
