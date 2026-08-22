const ObjectDropdown = ({ selectedObject, onChange,}) => {

    const objects = [
        {
            name: "Account",
            value: "Account",
        },
        {
            name: "Opportunity",
            value: "Opportunity",
        },
        {
            name: "Lead",
            value: "Lead",
        },
        {
            name: "Contact",
            value: "Contact",
        },
        {
            name: "Case",
            value: "Case",
        },
    ];
    
    return (
        <div className="object-selector">

            <label htmlFor="salesforce-object"> Select Salesforce Object</label>

            <select
                id="salesforce-object"
                value={selectedObject}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">
                    -- Select Object --
                </option>

                {
                    objects?.map((object) => (
                    <option
                        key={object.value}
                        value={object.value}
                    >
                        {object.name}
                    </option>
                    ))
                }
            </select>
        </div>
    );
}
export default ObjectDropdown;