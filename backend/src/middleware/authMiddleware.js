function requireAuth(req, res, next) {

    if (!req.session || !req.session.salesforce) {

        return res.status(401).json({
            error: "Not authenticated",
            message: "Please login with Salesforce first.",
        });

    }

    next();

}

module.exports = requireAuth;