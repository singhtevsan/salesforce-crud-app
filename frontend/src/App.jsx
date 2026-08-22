import {useEffect, useState} from "react";
import LoginButton from "./components/LoginButton";
import ObjectDropdown from "./components/ObjectDropdown";
import RecordTable from "./components/RecordTable";
import RecordForm from "./components/RecordForm";
import {
  getCurrentUser,
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
} from "./services/api";
import "./App.css";

// Salesforce fields
const OBJECT_FIELDS = {
  Account: [
    "Id",
    "Name",
    "Phone",
    "Website",
    "Industry",
    "Type",
  ],
  Opportunity: [
    "Id",
    "Name",
    "Amount",
    "StageName",
    "CloseDate",
    "Type",
  ],
  Lead: [
    "Id",
    "FirstName",
    "LastName",
    "Company",
    "Email",
    "Phone",
  ],
  Contact: [
    "Id",
    "FirstName",
    "LastName",
    "Email",
    "Phone",
    "Title",
  ],
  Case: [
    "Id",
    "CaseNumber",
    "Subject",
    "Status",
    "Priority",
    "Origin",
  ],
};

// Main App
function App() {

  // Logged-in Salesforce user
  const [user, setUser] = useState(null);

  // Currently selected Salesforce object
  const [selectedObject, setSelectedObject] = useState("");

  // Salesforce records displayed on screen
  const [records, setRecords] = useState([]);

  // Loading status
  const [loading, setLoading] = useState(false);

  // Pagination offset
  const [offset, setOffset] = useState(0);

  // Are there more records?
  const [hasMore, setHasMore] = useState(true);

  // Show create/edit form
  const [showForm, setShowForm] = useState(false);

  // Record currently being edited
  const [editingRecord, setEditingRecord] = useState(null);

  // Record currently being viewed
  const [viewingRecord, setViewingRecord] = useState(null);

  // Check login when application starts
  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () =>{

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log("User is not logged in");
    }
  }

  // Load Salesforce records
  const loadRecords = async(objectName,newOffset = 0) => {

    if (!objectName) {
      return;
    }

    try {
      setLoading(true);
      const data = await getRecords(objectName,newOffset);
      const newRecords = data.records || [];

      // First page
      if (newOffset === 0) {
        setRecords(newRecords);
      }
      // Next page
      else {
        setRecords((previous) => [
          ...previous,
          ...newRecords,
        ]);
      }
      setOffset(newOffset);
      setHasMore(newRecords.length === 20);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  // User selects Salesforce object
  const handleObjectChange = async(objectName) => {
    setSelectedObject(objectName);
    setRecords([]);
    setOffset(0);
    setHasMore(true);
    setViewingRecord(null);
    setEditingRecord(null);
    setShowForm(false);

    if (objectName) {
      await loadRecords(objectName,0);
    }
  }

  // Create button
  const handleCreate= () => {
    setEditingRecord(null);
    setShowForm(true);
  }

  // Edit button
  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  }

  // View button
  const handleView = (record) => {
    setViewingRecord(record);
  }

  // Delete button
  const handleDelete = async(record) => {
    const confirmed = window.confirm( `Are you sure you want to delete this ${selectedObject}?`);
    if (!confirmed) {
      return;
    }
    try {
      await deleteRecord(selectedObject,record.Id);
      // Remove deleted record
      // from the React screen
      setRecords(
        (previous) =>
          previous.filter(
            (item) =>
              item.Id !== record.Id
          )
      );
      alert("Record deleted successfully.");
    } catch (error) {
      alert(error.message);
    }
  }

  // Save Create/Edit form
  const handleSave = async(formData) => {
    try {
      // EDIT
      if (editingRecord) {
        await updateRecord(selectedObject, editingRecord.Id, formData);
        alert("Record updated successfully.");
      }
      // CREATE
      else {
        await createRecord(selectedObject, formData);
        alert("Record created successfully.");
      }
      // Close form
      setShowForm(false);
      setEditingRecord(null);
      // Reload first page
      await loadRecords(selectedObject,0);
    } catch (error) {
      alert(error.message);
    }
  }

  // Infinite scrolling
  const handleScroll = async () =>{
    if (loading || !hasMore || !selectedObject) {
      return;
    }

    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;
    // When user reaches
    // near the bottom
    if (scrollPosition >= pageHeight - 300) {
      await loadRecords(selectedObject, offset + 20);
    }
  }

  // Add scrolling listener
  useEffect(() => {
    window.addEventListener("scroll",handleScroll);
    return () => {
      window.removeEventListener("scroll",handleScroll);
    };
  }, [loading, hasMore, selectedObject, offset,]);

  // Logout
  const handleLogout = () => {
    setUser(null);
    setSelectedObject("");
    setRecords([]);
  }

  // Get fields for selected object
  const fields = OBJECT_FIELDS[selectedObject] || [];
  
  // React UI
  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div>
          <h1>Salesforce CRUD Application</h1>
          <p>Manage Salesforce records from React</p>
        </div>

        <LoginButton
          user={user}
          onLogout={handleLogout}
        />

      </header>

      {/* MAIN */}
      <main className="container">

        {/* User is NOT logged in */}
        {
          !user 
          ? (
            <div className="welcome">
              <h2>Welcome to Salesforce CRUD</h2>
              <p>Login with Salesforce to manage Accounts, Opportunities, Leads, Contacts and Cases.</p>
            </div>
          ) 
          : (
            <>
              {/* Object dropdown */}
              <ObjectDropdown
                selectedObject={selectedObject}
                onChange={handleObjectChange}
              />

              {/* Records */}
              {
                selectedObject && (
                <>
                  <div className="toolbar">
                    <h2>{selectedObject} Records</h2>
                    <button
                      onClick={handleCreate}
                      className="create-button"
                    >
                      + Create {selectedObject}
                    </button>
                  </div>

                  <RecordTable
                    records={records}
                    fields={fields}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    loading={loading}
                  />
                  {
                    !hasMore &&
                    records.length > 0 && (
                      <div className="end-message">
                        No more records.
                      </div>
                    )
                  }
                </>
              )}
            </>
          )
        }

      </main>
      {/* CREATE / EDIT FORM */}
      {
        showForm && (
        <RecordForm
          objectName={selectedObject}
          record={editingRecord}
          fields={fields}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      )}

      {/* VIEW RECORD */}
      {
        viewingRecord && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>View {selectedObject}</h2>
            {
              fields?.map((field) => (
                <div
                  className="record-detail"
                  key={field}
                >
                  <strong>{field}:</strong>
                  <span>
                    {
                      viewingRecord[field] || "-"
                    }
                  </span>
                </div>
              )
            )}
            <button
              onClick={() => setViewingRecord(null)}
              className="cancel-button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;