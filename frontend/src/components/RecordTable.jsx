function RecordTable({records,fields,onView,onEdit,onDelete,loading}) {

    if (loading && records.length === 0) {
        return (
            <div className="loading">
                Loading records...
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="empty">
                No records found.
            </div>
        );
    }
    
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        {
                            fields.map((field) => (
                            <th key={field}>
                                {field}
                            </th>
                            ))
                        }
                        <th>
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        records?.map((record) => (
                        <tr key={record.Id}>
                            {
                                fields?.map((field) => (
                                <td key={field}>
                                    {record[field] ?? "-"}
                                </td>
                            ))}
                            <td className="actions">
                                <button
                                    onClick={() => onView(record)}
                                    className="view-button"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => onEdit(record)}
                                    className="edit-button"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(record)}
                                    className="delete-button"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                        ))
                    }
                </tbody>
            </table>
            {
                loading && (
                <div className="loading-more">
                    Loading more records...
                </div>
                )
            }
        </div>
    );
}
export default RecordTable;