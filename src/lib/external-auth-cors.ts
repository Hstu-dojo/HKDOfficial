import { NextRequest, NextResponse } from 'next/server';

export function withExternalAuthCors(request: NextRequest, response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Requested-With, Accept, Origin'
  );
  response.headers.set('Access-Control-Max-Age', '600');

  return response;
}

export function externalAuthOptions(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  return withExternalAuthCors(request, response);
}
