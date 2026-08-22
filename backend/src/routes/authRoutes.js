const express = require("express");
const crypto = require("crypto");

const {
    getAuthorizationUrl,
    exchangeCodeForToken,
    getUserInfo
} = require("../services/salesforceService");

const router = express.Router();


// Login

router.get("/login", (req, res) => {
    try {

        const state = crypto.randomBytes(32).toString("hex");
        const {url,codeVerifier} = getAuthorizationUrl(state);

        req.session.oauthState = state;
        req.session.salesforceCodeVerifier = codeVerifier;

        req.session.save((err) => {
            if (err) {
                console.error("OAuth session save error:", err);

                return res.status(500).json({
                    error: "Could not initialize OAuth session"
                });
            }

            console.log("SALESFORCE LOGIN");
            console.log("Session ID:", req.sessionID);
            console.log("OAuth state:", state);
            console.log("PKCE verifier exists:", !!req.session.salesforceCodeVerifier);
            console.log("Redirecting to Salesforce");

            res.redirect(url);
        });

    } catch (error) {
        console.error("OAuth login error:", error);
        res.status(500).json({
            error: "Could not start Salesforce login"
        });
    }
});


// OAuth callback

router.get("/callback", async (req, res) => {

        console.log("SALESFORCE OAUTH CALLBACK");
        console.log("CALLBACK SESSION ID:", req.sessionID);
        console.log("CALLBACK COOKIE:", req.headers.cookie);
        console.log("CALLBACK SESSION:", req.session);
        console.log("CALLBACK QUERY:", req.query);

        try {
            const { code, state, error, error_description} = req.query;

            // Salesforce returned an error
            if (error) {
                return res.status(400).send(
                    `Salesforce OAuth error: ${
                        error_description || error
                    }`
                );
            }

            // Check OAuth state
            console.log("Received state:", state);
            console.log("Session state:", req.session?.oauthState);

            if (!state || state !== req.session?.oauthState) {
                console.error("OAuth STATE MISMATCH");
                return res.status(400).send(
                    "Invalid OAuth state."
                );
            }

            // Check authorization code
            if (!code) {
                return res.status(400).send(
                    "Authorization code missing."
                );
            }

            // Get PKCE verifier
            const codeVerifier = req.session?.salesforceCodeVerifier;
            console.log("PKCE verifier exists:", !!codeVerifier);

            if (!codeVerifier) {
                return res.status(400).send(
                    "PKCE code verifier missing."
                );
            }

            // Exchange code + verifier for tokens
            const tokenData = await exchangeCodeForToken(code, codeVerifier);
            console.log("Salesforce token exchange successful");

            // PKCE verifier no longer needed
            delete req.session.salesforceCodeVerifier;

            // Save Salesforce data
            req.session.salesforce = {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                instanceUrl: tokenData.instance_url,
                identityUrl: tokenData.id,
            };


            // Get Salesforce user information
            try {
                const user = await getUserInfo(tokenData.access_token, tokenData.id);
                req.session.salesforce.user = {
                    id: user.user_id,
                    username: user.username,
                    displayName: user.display_name,
                    organizationId: user.organization_id,
                };

                console.log("Salesforce user:", req.session.salesforce.user);
            } catch (userError) {
                console.error("Could not retrieve Salesforce user:", userError.response?.data || userError.message);
            }

            // Save final session
            req.session.save(
                (saveError) => {
                    if (saveError) {
                        console.error( "FINAL SESSION SAVE ERROR:", saveError);
                        return res.status(500).send(
                            "Could not save login session."
                        );
                    }

                    console.log("FINAL SESSION SAVED");
                    console.log("FINAL SESSION ID:", req.sessionID);
                    console.log("Salesforce authenticated:", !!req.session.salesforce);
                    console.log("Redirecting to:", process.env.FRONTEND_URL);

                    res.redirect(process.env.FRONTEND_URL);
                }
            );

        } catch (error) {
            console.error("OAuth callback error:", error.response?.data || error.message);
            res.status(500).send(
                "Salesforce login failed."
            );
        }

    }
);

// Current user

router.get("/me", (req, res) => {
        if (!req.session || !req.session.salesforce) {

            return res.status(401).json({
                authenticated: false,
            });
        }

        const sf = req.session.salesforce;
        res.json({
            authenticated: true,
            name: sf.user?.displayName || sf.user?.username || "Salesforce User",
            username: sf.user?.username,
            userId: sf.user?.id,
            organizationId: sf.user?.organizationId
        });
    }
);

// Logout

router.post("/logout", (req, res) => {

        req.session.destroy(
            (error) => {
                if (error) {
                    return res.status(500).json({
                        error: "Logout failed",
                    });
                }
                res.clearCookie("connect.sid");
                res.json({
                    message: "Logged out successfully",
                });
            }
        );
    }
);

module.exports = router;