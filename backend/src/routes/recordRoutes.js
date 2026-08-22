const express = require("express");
const requireAuth = require("../middleware/authMiddleware");

const {salesforceGet, salesforcePost, salesforcePatch, salesforceDelete} = require("../services/salesforceService");
const router = express.Router();

// Allowed Salesforce objects

const OBJECT_FIELDS = {

    Account: [
        "Id",
        "Name",
        "Phone",
        "Website",
        "Industry",
        "Type"
    ],
    Opportunity: [
        "Id",
        "Name",
        "Amount",
        "StageName",
        "CloseDate",
        "Type"
    ],
    Lead: [
        "Id",
        "FirstName",
        "LastName",
        "Company",
        "Email",
        "Phone"
    ],
    Contact: [
        "Id",
        "FirstName",
        "LastName",
        "Email",
        "Phone",
        "Title"
    ],
    Case: [
        "Id",
        "CaseNumber",
        "Subject",
        "Status",
        "Priority",
        "Origin"
    ],
};

// Fields that Salesforce automatically controls

const READ_ONLY_FIELDS = {
    Account: ["Id"],
    Opportunity: ["Id"],
    Lead: ["Id"],
    Contact: ["Id"],
    Case: ["Id","CaseNumber"]
};

// Validate object name

function validateObject(objectName) {
    if (!OBJECT_FIELDS[objectName]) {
        return false;
    }
    return true;
}

// Clean incoming data

function cleanRecordData(objectName,data) {

    const allowedFields = OBJECT_FIELDS[objectName];
    const readOnlyFields = READ_ONLY_FIELDS[objectName] || [];
    const cleaned = {};

    for (const field of allowedFields) {
        if (readOnlyFields.includes(field)) {
            continue;
        }
        if (Object.prototype.hasOwnProperty.call(data,field)) {
            cleaned[field] = data[field];
        }

    }
    return cleaned;
}

// GET records
// GET: /api/records/Account?offset=0&limit=20

router.get("/:objectName", requireAuth, async (req, res) => {

        try {
            const {objectName} = req.params;

            if (!validateObject(objectName)) {
                return res.status(400).json({
                    error: "Invalid Salesforce object"});
            }

            let offset = parseInt(req.query.offset || "0", 10);
            let limit = parseInt(req.query.limit || "20", 10);

            // Force safe values
            if (Number.isNaN(offset) || offset < 0) {
                offset = 0;
            }
            if (Number.isNaN(limit) || limit <= 0 || limit > 20) {
                limit = 20;
            }

            const fields = OBJECT_FIELDS[ objectName].join(", ");
            const soql =
                `SELECT ${fields} ` +
                `FROM ${objectName} ` +
                `ORDER BY Id ` +
                `LIMIT ${limit} ` +
                `OFFSET ${offset}`;

            const encodedQuery = encodeURIComponent(soql);
            const data = await salesforceGet(req.session.salesforce, `/query?q=${encodedQuery}`);

            res.json({
                records: data.records || [],
                totalSize: data.totalSize || 0,
                done: data.done,
                nextRecordsUrl: data.nextRecordsUrl || null,
            });

        } catch (error) {

            console.error("GET records error:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                error: "Unable to load Salesforce records",
                details: error.response?.data || error.message,
            });
        }
    }
);

// GET ONE RECORD
// GET: /api/records/Account/001XXXXXXXX

router.get("/:objectName/:recordId", requireAuth, async (req, res) => {

        try {
            const {objectName, recordId} = req.params;

            if (!validateObject(objectName)) {

                return res.status(400).json({
                    error: "Invalid Salesforce object",
                });
            }

            const fields = OBJECT_FIELDS[objectName].join(", ");
            const soql =
                `SELECT ${fields} ` +
                `FROM ${objectName} ` +
                `WHERE Id = '${recordId}' ` +
                `LIMIT 1`;

            const encodedQuery = encodeURIComponent(soql);
            const data = await salesforceGet(
                    req.session.salesforce, `/query?q=${encodedQuery}`
                );

            if (!data.records || data.records.length === 0) {

                return res.status(404).json({
                    error: "Record not found",
                });

            }

            res.json(
                data.records[0]
            );

        } catch (error) {
            console.error("GET one record error:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                error: "Unable to load Salesforce record",
                details: error.response?.data || error.message,
            });
        }
    }
);

// CREATE RECORD
// POST: /api/records/Account

router.post("/:objectName", requireAuth, async (req, res) => {

        try {
            const {objectName} = req.params;

            if (!validateObject(objectName)) {

                return res.status(400).json({
                    error: "Invalid Salesforce object",
                });

            }

            const recordData = cleanRecordData(objectName, req.body);

            if (Object.keys(recordData).length === 0) {

                return res.status(400).json({
                    error: "No valid fields supplied",
                });
            }

            const result = await salesforcePost(
                    req.session.salesforce, `/sobjects/${objectName}/`, recordData
                );

            res.status(201).json({
                message: "Record created successfully", result
            });

        } catch (error) {
            console.error("CREATE record error:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                error:"Unable to create Salesforce record",
                details: error.response?.data || error.message,
            });
        }
    }
);

// UPDATE RECORD
// PUT: /api/records/Account/001XXXXXXXX

router.put("/:objectName/:recordId", requireAuth, async (req, res) => {

        try {
            const {objectName, recordId} = req.params;

            if (!validateObject(objectName)) {

                return res.status(400).json({
                    error:"Invalid Salesforce object",
                });
            }

            const recordData = cleanRecordData(objectName, req.body);

            if (Object.keys(recordData).length === 0) {
                return res.status(400).json({
                    error: "No valid fields supplied"
                });
            }

            const result = await salesforcePatch(
                    req.session.salesforce,
                    `/sobjects/${objectName}/${recordId}`,
                    recordData
                );

            res.json({
                message: "Record updated successfully", result,
            });
        } catch (error) {
            console.error("UPDATE record error:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                error: "Unable to update Salesforce record",
                details: error.response?.data || error.message,
            });
        }
    }
);

// DELETE RECORD
// DELETE: /api/records/Account/001XXXXXXXX

router.delete("/:objectName/:recordId", requireAuth, async (req, res) => {

        try {
            const {objectName, recordId} = req.params;

            if (!validateObject(objectName)) {

                return res.status(400).json({
                    error:"Invalid Salesforce object"
                });
            }
            await salesforceDelete(req.session.salesforce,
                `/sobjects/${objectName}/${recordId}`
            );

            res.json({
                message: "Record deleted successfully",
            });

        } catch (error) {
            console.error("DELETE record error:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                error: "Unable to delete Salesforce record",
                details: error.response?.data || error.message,
            });
        }
    }
);

module.exports = router;
