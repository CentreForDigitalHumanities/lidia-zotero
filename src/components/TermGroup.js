import React, { useState } from 'react';


const TermGroup = ({ value, onChange }) => {

    const [termGroupObj, setTermGroupObj] = useState(value);

    const handleChange = (event) => {
        setTermGroupObj((prevState) => {
            const newTermGroupObj = { ...prevState, [event.target.name]: event.target.value };
            onChange(newTermGroupObj);
            return newTermGroupObj;
        });
    };

    return (
        <div style={{color: "red"}}>

            <div>{JSON.stringify(termGroupObj)}</div>

            <div style={{display: "inline-block", margin: "0 5px 0 0"}}>
                <label htmlFor="termtype" style={{display: "block"}}>Term type</label>
                <select name="termtype" value={termGroupObj.termtype} onChange={handleChange}>
                    <option value="Undefined">Undefined</option>
                    <option value="Definiendum">Definiendum</option>
                    <option value="Definiens">Definiens</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div style={{display: "inline-block", margin: "0 5px 0 0"}}>
                <label htmlFor="articleterm" style={{display: "block"}}>Article term</label>
                <input name="articleterm" type="text" value={termGroupObj.articleterm} onChange={handleChange}/>
            </div>

            <div style={{display: "inline-block", margin: "0"}}>
                <label htmlFor="lidiaterm" style={{display: "block"}}>LIDIA term</label>
                <input name="lidiaterm" type="text" value={termGroupObj.lidiaterm} onChange={handleChange}/>
                {/* TODO: Ideally this would be select-or-other so we don't need another field */}
            </div>
        </div>
    )
}

export default TermGroup;
