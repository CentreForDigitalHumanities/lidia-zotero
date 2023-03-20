import React from 'react';
import { useState } from "react";

function AnnotationForm(props) {
    // argname: lidiaArgumentName.label
    // linglevel: lidiaLinguisticLevel.label
    // arglang: lidiaArgumentLanguage.label
    // description: lidiaArgumentDescription.label

    const [lidiaFields, setLidiaFields] = useState({
        argname: props.data.argname,
        linglevel: props.data.linglevel,
        arglang: props.data.arglang,
        argdescr: props.data.description,
    });

    const handleChange = (event) => {
        setLidiaFields({ ...lidiaFields, [event.target.name]: event.target.value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        props.onSave(lidiaFields);
        alert(lidiaFields.argdescr);
    }

    const divStyle = {
        width: '400px',
        color: 'blue',
    };

    return (
        <div style={divStyle}>

            <form onSubmit={handleSubmit}>

                <div>{props.annotationText}</div>

                {!props.data &&
                    <div className='external-annotation'>
                        <p>External annotation</p>
                    </div>
                }

                {props.data &&
                    <fieldset disabled={props.disabled}>
                        <div className='lidia-annotation'>
                            <div>
                                <label htmlFor="argname">Argument name</label>
                                <input type="text" name="argname" value={lidiaFields.argname} onChange={handleChange} />
                            </div>

                            <div>
                                <label htmlFor="linglevel">Linguistic level</label>
                                <input type="text" name="linglevel" value={lidiaFields.linglevel} onChange={handleChange} />
                            </div>

                            <div>
                                <label htmlFor="arglang">Language</label>
                                <select name="arglang" value={lidiaFields.arglang} onChange={handleChange} >
                                    <option value="en">English</option>
                                    <option value="nl">Dutch</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="argdescr">Short description</label>
                                <textarea name="argdescr" rows="5" value={lidiaFields.argdescr} onChange={handleChange} />
                            </div>

                            <button type='submit'>Save</button>

                        </div>
                    </fieldset>
                }
            </form>
        </div>
    );
}

export default AnnotationForm;
