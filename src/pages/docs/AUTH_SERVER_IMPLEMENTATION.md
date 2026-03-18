# Auth Server Implementation Skeleton (Express.js)

Copy and adapt these Express.js route handlers to your main auth app.

---

## 1) `POST /oauth2/authorize`

Browser-based authorization endpoint. User logs in and auth server issues authorization code.

```typescript
import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const authRouter = Router();

interface AuthSessionStore {
  [key: string]: {
    clientId: string;
    redirectUri: string;
    userId: string;
    role: string; // must be from accepted enum
    email: string;
    codeChallenge: string;
    state: string;
    createdAt: number;
  };
}

const sessionStore: AuthSessionStore = {}; // In production, use Redis/DB

/**
 * GET /oauth2/authorize
 * Browser redirect endpoint. User authenticates, server issues code.
 */
authRouter.get('/oauth2/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = req.query;

  // Validate required params
  if (!client_id || !redirect_uri || response_type !== 'code' || !state || !code_challenge) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  if (code_challenge_method !== 'S256') {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Only S256 supported' });
  }

  // Validate client_id against registered clients (example check)
  const registeredClients = ['dojo-app']; // Replace with actual client registry
  if (!registeredClients.includes(client_id as string)) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  // TODO: If user not logged in, redirect to login page
  // For now, assume user credentials available from session/middleware
  const userId = req.session?.userId || 'user_123'; // Example
  const userEmail = req.session?.email || 'user@example.com';
  const userRole = req.session?.role || 'student_4th_kyu'; // Must validate this is in enum

  // Generate authorization code
  const authCode = crypto.randomBytes(32).toString('hex');

  // Store authorization context
  sessionStore[authCode] = {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    userId,
    role: userRole,
    email: userEmail,
    codeChallenge: code_challenge as string,
    state: state as string,
    createdAt: Date.now(),
  };

  // Expire code after 10 minutes
  setTimeout(() => delete sessionStore[authCode], 10 * 60 * 1000);

  // Redirect back to app with code
  const callbackUrl = new URL(redirect_uri as string);
  callbackUrl.searchParams.set('code', authCode);
  callbackUrl.searchParams.set('state', state as string);

  return res.redirect(callbackUrl.toString());
});
```

---

## 2) `POST /oauth2/token`

Token exchange endpoint. App exchanges authorization code for access + refresh tokens.

```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCEPTED_ROLES = [
  'student_9th_kyu', 'student_8th_kyu', 'student_7th_kyu', 'student_6th_kyu',
  'student_5th_kyu', 'student_4th_kyu', 'student_3rd_kyu', 'student_2nd_kyu',
  'student_1st_kyu', 'black_belt', 'teacher', 'admin',
];

interface TokenStore {
  [key: string]: {
    userId: string;
    role: string;
    email: string;
    issuedAt: number;
  };
}

const refreshTokenStore: TokenStore = {}; // In production, use Redis/DB
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key';

/**
 * POST /oauth2/token
 * Exchanges auth code for tokens (authorization_code grant)
 * or refreshes access token (refresh_token grant).
 */
authRouter.post('/oauth2/token', express.urlencoded({ extended: false }), (req: Request, res: Response) => {
  const { grant_type, client_id, code, redirect_uri, code_verifier, refresh_token } = req.body;

  // Validate client_id
  const registeredClients = ['dojo-app'];
  if (!registeredClients.includes(client_id)) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  if (grant_type === 'authorization_code') {
    // Authorization Code flow
    if (!code || !code_verifier) {
      return res.status(400).json({ error: 'invalid_request' });
    }

    const session = sessionStore[code];
    if (!session) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    // Check code expiry (10 minute window)
    if (Date.now() - session.createdAt > 10 * 60 * 1000) {
      delete sessionStore[code];
      return res.status(400).json({ error: 'invalid_grant', error_description: 'code expired' });
    }

    // Validate PKCE
    const codeChallenge = crypto
      .createHash('sha256')
      .update(code_verifier as string)
      .digest('base64url');

    if (codeChallenge !== session.codeChallenge) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'pkce mismatch' });
    }

    // Validate role enum
    if (!ACCEPTED_ROLES.includes(session.role)) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'invalid role' });
    }

    // Issue access token
    const accessToken = jwt.sign(
      {
        sub: session.userId,
        email: session.email,
        role: session.role,
        jti: crypto.randomBytes(8).toString('hex'),
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Issue refresh token
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');
    refreshTokenStore[refreshTokenValue] = {
      userId: session.userId,
      role: session.role,
      email: session.email,
      issuedAt: Date.now(),
    };

    // Clean up auth code
    delete sessionStore[code];

    return res.json({
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email offline_access',
    });
  } else if (grant_type === 'refresh_token') {
    // Refresh Token flow
    if (!refresh_token) {
      return res.status(400).json({ error: 'invalid_request' });
    }

    const tokenData = refreshTokenStore[refresh_token as string];
    if (!tokenData) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    // Validate role enum
    if (!ACCEPTED_ROLES.includes(tokenData.role)) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'invalid role' });
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      {
        sub: tokenData.userId,
        email: tokenData.email,
        role: tokenData.role,
        jti: crypto.randomBytes(8).toString('hex'),
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      access_token: newAccessToken,
      refresh_token, // Can rotate refresh token if desired
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email offline_access',
    });
  } else {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }
});
```

---

## 3) `POST /api/v1/introspect` (MANDATORY)

Token introspection endpoint called by video server for every protected request.

```typescript
/**
 * POST /api/v1/introspect
 * Video server (machine-to-machine) calls this to validate token + get user identity.
 */
authRouter.post('/api/v1/introspect', express.json(), (req: Request, res: Response) => {
  const serviceToken = req.headers.authorization?.replace('Bearer ', '');
  const { token } = req.body;

  // Validate service token (issued by auth app to video server)
  const validServiceToken = process.env.AUTH_SERVER_SERVICE_TOKEN || 'service-token-xyz';
  if (serviceToken !== validServiceToken) {
    return res.status(403).json({ error: 'invalid_service_token' });
  }

  if (!token) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
      jti?: string;
    };

    // Validate role enum
    if (!ACCEPTED_ROLES.includes(decoded.role)) {
      return res.status(200).json({ active: false });
    }

    // Check token revocation (if using jti)
    // const isRevoked = await checkTokenRevocation(decoded.jti);
    // if (isRevoked) return res.status(200).json({ active: false });

    return res.json({
      active: true,
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    });
  } catch (error) {
    // Invalid or expired token
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(200).json({ active: false });
    }
    return res.status(200).json({ active: false });
  }
});
```

---

## 4) `POST /oauth2/revoke` (optional)

Token revocation endpoint for logout.

```typescript
/**
 * POST /oauth2/revoke
 * App calls this to revoke refresh token on logout.
 */
authRouter.post('/oauth2/revoke', express.urlencoded({ extended: false }), (req: Request, res: Response) => {
  const { token, client_id } = req.body;

  // Validate client_id
  const registeredClients = ['dojo-app'];
  if (!registeredClients.includes(client_id)) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  if (token && refreshTokenStore[token]) {
    delete refreshTokenStore[token];
  }

  // Return 200 regardless for privacy
  return res.status(200).send('');
});
```

---

## 5) `GET /api/v1/auth/me` (optional)

Quick user profile endpoint for app.

```typescript
/**
 * GET /api/v1/auth/me
 * App calls this with access token to get user profile.
 */
authRouter.get('/api/v1/auth/me', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'missing_token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
    };

    return res.json({
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    });
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
});
```

---

## Integration Checklist

- [ ] Install dependencies: `npm install jsonwebtoken crypto`
- [ ] Set env vars:
  - `JWT_SECRET=<strong-random-key>`
  - `REFRESH_TOKEN_SECRET=<strong-random-key>`
  - `AUTH_SERVER_SERVICE_TOKEN=<token-sent-to-video-server>`
- [ ] Replace in-memory stores (`sessionStore`, `refreshTokenStore`) with Redis/DB
- [ ] Implement actual user login at `/oauth2/authorize` (currently assumes session exists)
- [ ] Register valid `client_id` values (currently just `'dojo-app'`)
- [ ] Add token revocation tracking if needed (jti-based)
- [ ] Test with curl examples from `AUTH_APP_INTEGRATION.md`
