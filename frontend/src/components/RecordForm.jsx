import { useEffect, useState } from "react";

const RecordForm = ({objectName, record, fields, onSave, onCancel}) => {
    
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const initialData = {};
        fields.forEach((field) => {
            initialData[field] = record?.[field] || "";
        });

        setFormData(initialData);

    }, [record, fields]);

    function handleChange(event) {
        const {name, value} = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        onSave(formData);
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>
                    {
                        record
                        ? `Edit ${objectName}`
                        : `Create ${objectName}`}
                </h2>
                
                <form onSubmit={handleSubmit}>
                    {
                        fields.map((field) => (
                        <div
                            className="form-group"
                            key={field}
                        >
                            <label htmlFor={field}>
                                {field}
                            </label>
                            <input
                                id={field}
                                name={field}
                                value={
                                    formData[field] || ""
                                }
                                onChange={handleChange}
                                disabled={field === "Id"}
                            />
                        </div>
                        ))
                    }
                    
                    <div className="form-actions">
                        <button
                            type="submit"
                            className="save-button"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default RecordForm;