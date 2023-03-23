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
        description: props.data.description,
    });


    React.useEffect(() => {
        setLidiaFields(props.data)
    }, [props.data]);


    const handleChange = (event) => {
        setLidiaFields({ ...lidiaFields, [event.target.name]: event.target.value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        props.onSave(lidiaFields);
    }

    const divStyle = {
        //width: '400px',
        margin: '5px',
    };

    const formStyle = {
        display: 'grid',
    };

    const labelStyle = {
        marginTop: '5px',
    }

    return (
        <div style={divStyle}>

            <form onSubmit={handleSubmit}>



                {!props.data &&
                    <div className='external-annotation'>
                        <p>External annotation</p>
                    </div>
                }

                {props.data &&
                    <fieldset style={{width: '92%'}} disabled={props.disabled}>
                        <div style={labelStyle}>Argument text:</div>

                        <div style={{fontSize: 'x-small'}}>{props.annotationText}</div>

                        <div className='lidia-annotation' style={formStyle} >
                            <div style={labelStyle}>
                                <label htmlFor="argname">Argument name:</label>
                                </div>

                            <div>
                            <input type="text" style={{width: '92%'}} name="argname" value={lidiaFields.argname} onChange={handleChange} />
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="linglevel">Linguistic level:</label>
                            </div>
                            <div>    <input type="text" style={{width: '92%'}} name="linglevel" value={lidiaFields.linglevel} onChange={handleChange} />
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="arglang">Language:</label>
                                </div>

                            <div><select name="arglang"  value={lidiaFields.arglang} onChange={handleChange} >
                                    <option value="en">English</option>
                                    <option value="nl">Dutch</option>
                                </select>
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="description">Short description:</label>
                                </div>

                            <div><textarea name="description" style={{width: '92%'}} type="textarea" rows="5" value={lidiaFields.description} onChange={handleChange} />
                            </div>

                            <div>
                            <button type='submit'>Save</button>
                            </div>

                        </div>
                    </fieldset>
                }
            </form>
        </div>
    );
}

export default AnnotationForm;
