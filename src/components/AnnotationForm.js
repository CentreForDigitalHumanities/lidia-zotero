import React from 'react';
import { useState } from "react";
import { iso6393 } from "iso-639-3";

let languageList = [];
function getLanguageList() {
    if (languageList.length > 0) {
        return languageList;
    } else {
        languageList = iso6393.filter(
            (obj) => { return obj.type === 'living' && typeof obj.iso6391 !== 'undefined' }
        ).map(({ name, iso6393 }) => [iso6393, name]);
        return languageList;
    }
}

function AnnotationForm(props) {
    log(getLanguageList()[0]);
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

    const languageRows = [(<option value="">(undefined)</option>)];
    for (language of getLanguageList()) {
        languageRows.push(<option value={language[0]}>{language[0]} – {language[1]}</option>);
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
                                <label htmlFor="arglang" style={fullWidthStyle}>Language:</label>
                            </div>

                            <div>
                                <select name="arglang" value={lidiaFields.arglang} onChange={handleChange} >
                                    {languageRows}
                                </select>
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
