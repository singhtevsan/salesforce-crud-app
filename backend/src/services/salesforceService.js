const axios = require("axios");
const crypto = require("crypto");

const {SALESFORCE_LOGIN_URL, SALESFORCE_API_VERSION, SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_CALLBACK_URL} = require("../config/salesforce");

function generateCodeVerifier() {
    return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(codeVerifier) {
    return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
}

function getAuthorizationUrl(state) {

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const params = new URLSearchParams({
        response_type: "code",
        client_id: SALESFORCE_CLIENT_ID,
        redirect_uri: SALESFORCE_CALLBACK_URL,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
    });
    return {
        url: `${SALESFORCE_LOGIN_URL}` + `/services/oauth2/authorize?` + params.toString(), codeVerifier,
    };
}

// OAuth - Exchange authorization code for tokens

async function exchangeCodeForToken(code, codeVerifier) {

    const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: SALESFORCE_CLIENT_ID,
        client_secret: SALESFORCE_CLIENT_SECRET,
        redirect_uri: SALESFORCE_CALLBACK_URL,
        code_verifier:  codeVerifier,
    });

    const response = await axios.post(`${SALESFORCE_LOGIN_URL}` + `/services/oauth2/token`, params.toString(),
        {
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",
            }
        }
    );
    return response.data;
}

// OAuth - Refresh access token

async function refreshAccessToken(refreshToken) {

    const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: SALESFORCE_CLIENT_ID,
        client_secret: SALESFORCE_CLIENT_SECRET,
    });
    const response = await axios.post(`${SALESFORCE_LOGIN_URL}` + `/services/oauth2/token`, params.toString(),
        {
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",
            }
        }
    );
    return response.data;
}

// Get Salesforce user information

async function getUserInfo(accessToken, identityUrl) {

    const response = await axios.get(identityUrl,
        {
            headers: {
                Authorization:
                    `Bearer ${accessToken}`,
            }
        }
    );
    return response.data;
}

// Create Salesforce API URL

function getApiUrl(instanceUrl, path) {
    return (`${instanceUrl}` + `/services/data/${SALESFORCE_API_VERSION}` + path);
}

// Generic Salesforce GET

async function salesforceGet(sessionData, path) {

    const response = await axios.get(getApiUrl(sessionData.instanceUrl, path),
        {
            headers: {
                Authorization:
                    `Bearer ${sessionData.accessToken}`,
            }
        }
    );
    return response.data;
}

// Generic Salesforce POST

async function salesforcePost(sessionData, path, data) {

    const response = await axios.post(getApiUrl(sessionData.instanceUrl, path),
        data,
        {
            headers: {
                Authorization:
                    `Bearer ${sessionData.accessToken}`,
                "Content-Type":
                    "application/json",
            }
        }
    );
    return response.data;
}

// Generic Salesforce PATCH

async function salesforcePatch(sessionData, path, data) {

    const response = await axios.patch(getApiUrl(sessionData.instanceUrl, path),
        data,
        {
            headers: {
                Authorization:
                    `Bearer ${sessionData.accessToken}`,
                "Content-Type":
                    "application/json",
            }
        }
    );
    return response.data;
}

// Generic Salesforce DELETE

async function salesforceDelete(sessionData, path) {

    const response = await axios.delete(getApiUrl(sessionData.instanceUrl, path),
        {
            headers: {
                Authorization:
                    `Bearer ${sessionData.accessToken}`,
            }
        }
    );
    return response.data;
}

// Export

module.exports = {
    getAuthorizationUrl,
    exchangeCodeForToken,
    refreshAccessToken,
    getUserInfo,
    salesforceGet,
    salesforcePost,
    salesforcePatch,
    salesforceDelete,
};
