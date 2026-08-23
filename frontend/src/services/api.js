const API_URL = "/api";

// Check whether the user is logged in
export async function getCurrentUser() {
    const response = await fetch(`${API_URL}/auth/me`,
    {
        credentials: "include",
    });
    if (!response.ok) {
        return null;
    }
    return response.json();
}

// Logout
export async function logout() {
    const response = await fetch(`${API_URL}/auth/logout`, 
    {
        method: "POST",
        credentials: "include",
    });
    return response.json();
}

// Get Salesforce records
export async function getRecords(objectName, offset = 0) {
    const response = await fetch(`${API_URL}/records/${objectName}?offset=${offset}&limit=20`,
        {
            credentials: "include",
        }
    );
    if (!response.ok) {
        throw new Error("Unable to load records");
    }
    return response.json();
}

// Get one Salesforce record
export async function getRecord(objectName, recordId) {
    const response = await fetch(`${API_URL}/records/${objectName}/${recordId}`,
        {
            credentials: "include",
        }
    );
    if (!response.ok) {
        throw new Error("Unable to load record");
    }
    return response.json();
}

// Create Salesforce record
export async function createRecord(objectName, data) {
    const response = await fetch(`${API_URL}/records/${objectName}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
        });
    if (!response.ok) {
        throw new Error("Unable to create record");
    }
    return response.json();
}

// Update Salesforce record
export async function updateRecord(objectName, recordId, data) {
    const response = await fetch(`${API_URL}/records/${objectName}/${recordId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
        }
    );
    if (!response.ok) {
        throw new Error("Unable to update record");
    }
    return response.json();
}

// Delete Salesforce record
export async function deleteRecord(objectName, recordId) {
    const response = await fetch(`${API_URL}/records/${objectName}/${recordId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );
    if (!response.ok) {
        throw new Error("Unable to delete record");
    }
    return response.json();
}