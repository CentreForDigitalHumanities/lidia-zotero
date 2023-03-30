import React from 'react';

/**
 * A select element. Props must have:
 * name, label, value, options dict, handleChange method
 * TODO: saving a previously empty field gets saved with a newline
 */
const SelectElement = (props) => {
    return (
        <div style={{margin: "5px"}}>
            <label style={{display: "block"}} htmlFor={props.name}>{props.label}</label>
            <select style={{display: "block"}} onChange={props.handleChange} value={props.value}>
                {props.options.map((option) => (
                    <option key={option.key} value={option.lemma}>
                        {option.term}
                    </option>
                ))}
            </select>

        </div>
    );
}

export default SelectElement;
