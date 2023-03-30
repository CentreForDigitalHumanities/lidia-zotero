import React from 'react';
import { useState } from "react";

import SelectElement from "./SelectElement";

// This works because we're using esbuild?
// Note: a SQLite file would be ~2.5 times smaller than this JSON
import lexiconOfLinguistics from './lexiconTerms.json';


function AnnotationForm(props) {
    // argname: lidiaArgumentName.label
    // linglevel: lidiaLinguisticLevel.label
    // arglang: lidiaArgumentLanguage.label
    // lexiconterm: lidiaLexiconTerm.label
    // description: lidiaArgumentDescription.label

    const [lidiaFields, setLidiaFields] = useState({
        argname: props.data.argname,
        linglevel: props.data.linglevel,
        lexiconterm: props.data.lexiconterm,
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
        margin: '5px',
    };

    const formStyle = {
        display: 'grid',
    };

    const labelStyle = {
        marginTop: '5px',
    }

    const fullWidthStyle = {
        width: '92%',
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
                    <fieldset style={fullWidthStyle} disabled={props.disabled}>
                        <div style={labelStyle}>Argument text:</div>

                        <div style={{fontSize: 'x-small'}}>{props.annotationText}</div>

                        <div className='lidia-annotation' style={formStyle} >
                            <div style={labelStyle}>
                                <label htmlFor="argname">Argument name:</label>
                            </div>

                            <div>
                                <input type="text" style={fullWidthStyle} name="argname" value={lidiaFields.argname} onChange={handleChange} />
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="linglevel">Linguistic level:</label>
                            </div>

                            <div>
                                <input type="text" style={fullWidthStyle} name="linglevel" value={lidiaFields.linglevel} onChange={handleChange} />
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="arglang">Language:</label>
                            </div>

                            <div>
                                <select name="arglang" value={lidiaFields.arglang} onChange={handleChange} >
                                    <option value="">(undefined)</option>
                                    <option value="en">English</option>
                                    <option value="nl">Dutch</option>
                                </select>
                            </div>

                            <div>
                                <SelectElement name='lexiconterm' label="Lexicon term" value={lidiaFields.lexiconterm || null } options={lexiconOfLinguistics} handleChange={handleChange}/>
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="description">Short description:</label>
                            </div>

                            <div>
                                <textarea name="description" style={fullWidthStyle} type="textarea" rows="5" value={lidiaFields.description} onChange={handleChange} />
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
