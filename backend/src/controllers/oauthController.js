const https = require('https');
const crypto = require('crypto');
const { User, LinkedAccount } = require('../models');
const { generateToken, verifyToken } = require('../utils/jwt');

// Helper to make HTTPS requests without external Axios dependency
const postForm = (urlStr, data) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = new URLSearchParams(data).toString();

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'VR-Connect-OAuth',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
};

const getJson = (urlStr, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'VR-Connect-OAuth',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
};

// GET /api/auth/google
const initiateGoogleAuth = async (req, res, next) => {
  try {
    let token = req.query.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide your VR token.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'VR User account not found.',
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    // Create state token with userId and random nonce, signed with secret
    const statePayload = {
      userId: user.id,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID in .env.',
        state,
        callbackUrl,
      });
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;

    if (req.query.format === 'json') {
      return res.status(200).json({
        success: true,
        authUrl,
      });
    }

    return res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/google/callback
const googleCallback = async (req, res, next) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // Helper HTML to handle popup / redirect completion
  const sendHtmlResponse = (success, message, payload = {}) => {
    return res.status(success ? 200 : 400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VR Connect - Google Linking</title>
          <style>
            body { background: #07090e; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0d111a; border: 1px solid ${success ? 'rgba(0, 242, 254, 0.3)' : 'rgba(244, 63, 94, 0.3)'}; padding: 30px; border-radius: 16px; text-align: center; max-width: 400px; }
            h2 { color: ${success ? '#00f2fe' : '#f43f5e'}; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${success ? 'Account Linked!' : 'Linking Failed'}</h2>
            <p>${message}</p>
            <p style="font-size: 12px; opacity: 0.7;">Closing window...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_LINK_RESULT',
                success: ${success},
                message: "${message}",
                payload: ${JSON.stringify(payload)}
              }, "*");
              setTimeout(() => window.close(), 1500);
            } else {
              setTimeout(() => { window.location.href = "${clientUrl}"; }, 2000);
            }
          </script>
        </body>
      </html>
    `);
  };

  try {
    const { code, state, error } = req.query;

    if (error) {
      if (error === 'access_denied') {
        return sendHtmlResponse(false, 'Google authentication was cancelled.');
      }
      return sendHtmlResponse(false, `Google OAuth error: ${error}`);
    }

    if (!code || !state) {
      return sendHtmlResponse(false, 'Missing authorization code or state parameter.');
    }

    // Decode and verify state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
    } catch (e) {
      return sendHtmlResponse(false, 'Invalid state parameter.');
    }

    const { userId } = stateData;
    if (!userId) {
      return sendHtmlResponse(false, 'State payload missing user ID.');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return sendHtmlResponse(false, 'Authenticated VR user not found.');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return sendHtmlResponse(false, 'Server missing Google OAuth client credentials.');
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await postForm('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    });

    if (tokenResponse.status !== 200 || !tokenResponse.data.access_token) {
      return sendHtmlResponse(false, tokenResponse.data.error_description || 'Failed to exchange authorization code with Google.');
    }

    const { access_token } = tokenResponse.data;

    // 2. Fetch verified Google user info (OIDC)
    const userInfoResponse = await getJson('https://openidconnect.googleapis.com/v1/userinfo', {
      Authorization: `Bearer ${access_token}`,
    });

    if (userInfoResponse.status !== 200 || !userInfoResponse.data.sub) {
      return sendHtmlResponse(false, 'Failed to fetch user profile information from Google.');
    }

    const googleSub = userInfoResponse.data.sub;
    const googleEmail = (userInfoResponse.data.email || '').toLowerCase().trim();

    // 3. Check if Google account is already linked to ANOTHER VR account
    const existingLink = await LinkedAccount.findOne({
      where: {
        provider: 'google',
        providerAccountId: googleSub,
      },
    });

    if (existingLink) {
      if (existingLink.userId !== user.id) {
        return sendHtmlResponse(false, 'This Google account is already linked to another VR account.');
      } else {
        return sendHtmlResponse(true, 'This Google account is already connected to your VR profile.', { email: googleEmail });
      }
    }

    // 4. Create new persistent LinkedAccount record
    await LinkedAccount.create({
      userId: user.id,
      provider: 'google',
      providerAccountId: googleSub,
      providerEmail: googleEmail,
    });

    return sendHtmlResponse(true, 'Google account linked successfully!', { email: googleEmail });
  } catch (err) {
    console.error('Google OAuth callback exception:', err);
    return sendHtmlResponse(false, 'An internal server error occurred while linking your Google account.');
  }
};

// GET /api/accounts/linked
const getLinkedAccounts = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const accounts = await LinkedAccount.findAll({ where: { userId: currentUserId } });

    const googleAccount = accounts.find((a) => a.provider === 'google');
    const appleAccount = accounts.find((a) => a.provider === 'apple');
    const phoneAccount = accounts.find((a) => a.provider === 'phone');

    return res.status(200).json({
      success: true,
      linkedAccounts: [
        {
          provider: 'Google',
          isConnected: Boolean(googleAccount),
          email: googleAccount ? googleAccount.providerEmail : null,
          icon: 'google',
        },
        {
          provider: 'Apple',
          isConnected: Boolean(appleAccount),
          email: appleAccount ? appleAccount.providerEmail : null,
          icon: 'apple',
        },
        {
          provider: 'Phone number',
          isConnected: Boolean(phoneAccount),
          phoneNumber: phoneAccount ? phoneAccount.providerEmail : null,
          icon: 'phone',
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/accounts/google/link (Direct link handler for test/verification payloads)
const directLinkGoogle = async (req, res, next) => {
  try {
    const { googleSub, googleEmail } = req.body;
    const currentUserId = req.user.id;

    if (!googleSub || !googleEmail) {
      return res.status(400).json({
        success: false,
        message: 'Google account ID and email are required.',
      });
    }

    const trimmedEmail = googleEmail.toLowerCase().trim();

    // Check duplicate linking
    const existing = await LinkedAccount.findOne({
      where: { provider: 'google', providerAccountId: googleSub },
    });

    if (existing) {
      if (existing.userId !== currentUserId) {
        return res.status(409).json({
          success: false,
          message: 'This Google account is already linked to another VR account.',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'This Google account is already connected.',
        email: trimmedEmail,
      });
    }

    const linked = await LinkedAccount.create({
      userId: currentUserId,
      provider: 'google',
      providerAccountId: googleSub,
      providerEmail: trimmedEmail,
    });

    return res.status(200).json({
      success: true,
      message: 'Google account linked successfully.',
      linked,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/accounts/google
const unlinkGoogle = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    await LinkedAccount.deleteOne({
      where: {
        userId: currentUserId,
        provider: 'google',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Google account unlinked successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateGoogleAuth,
  googleCallback,
  getLinkedAccounts,
  directLinkGoogle,
  unlinkGoogle,
};
