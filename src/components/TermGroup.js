import React, { useState } from 'react';


const TermGroup = ({ value, onChange }) => {

    const [termValues, setTermValues] = useState(value);

    const handleChange = (event) => {
        setTermValues((prevState) => {
            const newTermValues = { ...prevState, [event.target.name]: event.target.value };
            onChange(newTermValues);
            return newTermValues;
        });
    };

    return (
        <div style={{color: "red"}}>

            <div>{JSON.stringify(termValues)}</div>

            <div style={{display: "inline-block", margin: "0 5px 0 0"}}>
                <label htmlFor="termtype" style={{display: "block"}}>Term type</label>
                <select name="termtype" onChange={handleChange}>
                    <option value="Undefined">Undefined</option>
                    <option value="Definiendum">Definiendum</option>
                    <option value="Definiens">Definiens</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div style={{display: "inline-block", margin: "0 5px 0 0"}}>
                <label htmlFor="articleterm" style={{display: "block"}}>Article term</label>
                <input name="articleterm" type="text" value={termValues.articleterm} onChange={handleChange}/>
            </div>

            <div style={{display: "inline-block", margin: "0"}}>
                <label htmlFor="lidiaterm" style={{display: "block"}}>LIDIA term</label>
                <input name="lidiaterm" type="text" value={termValues.lidiaterm} onChange={handleChange}/>
                /* TODO: Ideally this would be select-or-other so we don't need another field */
            </div>
        </div>
    )
}

export default TermGroup;
