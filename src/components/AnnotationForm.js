import React from 'react';
import { useState } from "react";
import { iso6393 } from "iso-639-3";

import TermGroup from './TermGroup';


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

// Add "unspecified" to allow not making a choice, otherwise a
// provided default value is always saved.
const languageRows = [<option key="unspecified" value={"unspecified"}>[Not specified]</option>];
for (language of getLanguageList()) {
    languageRows.push(<option key={language[0]} value={language[0]}>{language[0]} – {language[1]}</option>);
}

const AnnotationForm = (props) => {
    /**
     * argcont: disable the rest of the form
     * pagestart
     * pageend: for entire passage in case of multiple pages
     * argname
     * linglevel
     * arglang
     * lexiconterm
     * customterm
     * termgroups: an array of termgroup objects {termtype, articleterm, lidiaterm}
     *   lidiaterm should be either a vocabulary term or a custom term
     * description
     */
    const [lidiaFields, setLidiaFields] = useState({
        argcont: props.data.argcont,
        pagestart: props.data.pagestart,
        pageend: props.data.pageend,
        argname: props.data.argname,
        termgroups: props.data.termgroups,
        arglang: props.data.arglang,
        description: props.data.description,
        relationType: props.data.relationType,
        relationTo: props.data.relationTo,
        lidiaId: props.data.lidiaId,
    });

    const [manualChange, setManualChange] = useState(false);

    const defaultTermGroup = {
        termtype: '',
        articleterm: '',
        category: '',
        lexiconterm: '',
        customterm: ''
    };
    if (props.defaults.default_termcategory) {
        defaultTermGroup.category = props.defaults.default_termcategory;
    }

    const addTermGroup = (index) => {
        setLidiaFields((prevState) => {
            const newTermGroups = [...prevState.termgroups, defaultTermGroup]
            return { ...prevState, 'termgroups': newTermGroups }
        });
        setManualChange(true);
    };

    const removeLastTermGroup = (index) => {
        setLidiaFields((prevState) => {
            const newTermGroups = prevState.termgroups.slice(0, -1);
            return { ...prevState, 'termgroups': newTermGroups }
        });
        setManualChange(true);
    };

    const takeTermsFromPrevious = () => {
        setLidiaFields((prevState) => {
            const newTermGroups = props.previousAnnotationData.termgroups;
            return { ...prevState, 'termgroups': newTermGroups };
        });
        setManualChange(true);
    };

    const handleTermGroupChange = (index, newValue) => {
        const newTermGroups = [...lidiaFields.termgroups];
        newTermGroups[index] = newValue;
        setLidiaFields((prevState) => {
            return { ...prevState, 'termgroups': newTermGroups }
        });
        setManualChange(true);
    };

    /* Fire onEdit if a change to lidiaFields has been made caused by
     * a manual edit. This check is important, because otherwise it is
     * called immediately after opening the form, which would mean that
     * empty annotations are saved. */
    React.useEffect(() => {
        if (manualChange) {
            props.onEdit(lidiaFields);
        }
    }, [lidiaFields]);

    const getValue = (field) => {
        // Get the value of a field that has to be displayed. In the case
        // of a continued annotation, this is not the value in lidiaFields
        // (which will be discarded when saving), but the value of the
        // previous annotation, so that the user sees which annotation is
        // being continued
        if (!lidiaFields.argcont) {
            return lidiaFields[field];
        } else {
            if (typeof props.previousAnnotationData !== "undefined") {
                return props.previousAnnotationData[field];
            } else {
                // Return empty value so that the form does not crash
                // Note: this will not work well for booleans
                return "";
            }
        }
    }

    const getTermGroupValue = (index) =>{
        if (!lidiaFields.argcont) {
            log(JSON.stringify(lidiaFields['termgroups'][index]));
            return lidiaFields['termgroups'][index];
        } else {
            if (typeof props.previousAnnotationData !== "undefined") {
                return props.previousAnnotationData['termgroups'][index];
            } else {
                return defaultTermGroup;
            }
        }
    }

    const handleChange = (event) => {
        setLidiaFields((prevState) => {
            return { ...prevState, [event.target.name]: event.target.value }
        });
        setManualChange(true);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        props.onSave(lidiaFields);
    }

    const handleToggleContinuation = (event) => {
        setLidiaFields((prevState) => {
            return { ...prevState, "argcont": event.target.checked}
        });
        setManualChange(true);
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

    /* Hack for Zotero 7: select elements with drop down lists don't open,
     * so change them into a scrolling list box by adjusting size property */
    const selectSize = getZoteroVersion() == 7 ? 5 : 1;

    const annotationRefRows = [(<option value="">(none)</option>)];

    let relationFound = false;
    for (let annotation of props.annotations) {
        if (annotation.lidiaId === lidiaFields.lidiaId) {
            // Do not allow self-reference
            continue;
        }
        if (lidiaFields.relationTo === annotation.lidiaId) {
            relationFound = true;
        }
        let shortTitle = annotation.documentTitle;
        if (!shortTitle) {
            shortTitle = "(untitled document)";
        } else if (shortTitle.length > 30) {
            shortTitle = shortTitle.substring(0, 28) + "…";
        }
        const argname = annotation.argname || "(untitled argument)";
        const display = shortTitle + ': ' + argname;
        annotationRefRows.push(<option value={annotation.lidiaId}>{display}</option>);
    }
    if (lidiaFields.relationTo && !relationFound) {
        annotationRefRows.push(<option value={lidiaFields.relationTo}>(previously deleted annotation)</option>);
    }

    const takeTermsFromPreviousDisabled = (typeof props.previousAnnotationData === "undefined" || !props.previousAnnotationData.termgroups) ? true : false;

    return (
        <div style={divStyle}>
            <form onSubmit={handleSubmit}>
                <div style={fullWidthStyle}>
                    <input type="checkbox" id="continuation" name="continuation" checked={lidiaFields.argcont ? 1 : 0} onChange={handleToggleContinuation} disabled={(!props.previousAnnotationData) ? 1 : 0} />
                    <label htmlFor="continuation">Annotation is continuation of previous argument (overwrites existing data)</label>
                </div>

                {props.data &&
                    <fieldset style={fullWidthStyle} disabled={lidiaFields.argcont}>
                        <div style={labelStyle}>Argument text:</div>

                        <div style={{fontSize: 'x-small'}}>{props.annotationText}</div>

                        <div className='lidia-annotation' style={formStyle} >

                            <div style={{marginTop: "1em", width: "92%"}}>
                                <div style={{display: "inline-block", margin: "5px;"}}>
                                    <label htmlFor="pagestart">Page start: </label>
                                    <input type="text" name="pagestart" value={getValue("pagestart")} onChange={handleChange} />
                                </div>

                                <div style={{margin: "5px", width: "92%"}}>
                                    <label htmlFor="pageend">Page end: </label>
                                    <input type="text" name="pageend" value={getValue("pageend")} onChange={handleChange} />
                                </div>
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="argname">Argument name:</label>
                            </div>

                            <div>
                                <input type="text" style={fullWidthStyle} name="argname" value={getValue("argname")} onChange={handleChange} />
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="arglang" style={fullWidthStyle}>Language:</label>
                            </div>

                            <div>
                                <select name="arglang" size={selectSize} value={getValue("arglang")} onChange={handleChange} >
                                    {languageRows}
                                </select>
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="description">Short description:</label>
                            </div>
                            <div>
                                <textarea name="description" style={fullWidthStyle} rows="5" value={getValue("description")} onChange={handleChange} />
                            </div>

                            <div style={labelStyle}>
                                <label>Relation:</label>
                            </div>
                            <div>
                                <select name="relationType" size={selectSize} style={{margin: "0 5px 0 0"}} value={getValue("relationType")} onChange={handleChange}>
                                    <option value="">(none)</option>
                                    <option value="contradicts">Contradicts</option>
                                    <option value="generalizes">Generalizes</option>
                                    <option value="invalidates">Invalidates</option>
                                    <option value="specialcase">Is a special case of</option>
                                    <option value="supports">Supports</option>
                                </select>
                                <select name="relationTo" size={selectSize} style={{margin: "0 5px 0 0"}} value={getValue("relationTo")} onChange={handleChange}>
                                    {annotationRefRows}
                                </select>
                            </div>

                            <div>
                                <h3>Terms</h3>
                                {lidiaFields.termgroups.map((termGroup, index) => (
                                    <><h4>Term {index + 1}</h4><TermGroup
                                        key={lidiaFields.lidiaId + index}
                                        value={getTermGroupValue(index)}
                                        onChange={(newValue) => handleTermGroupChange(index, newValue)} /></>
                                ))}
                                <button style={{margin: "5px 0 0 0"}} type="button" onClick={addTermGroup}>Add more terms</button>
                                <button style={{margin: "5px 0 0 0"}} type="button" onClick={removeLastTermGroup}>Remove last term</button>
                                {
                                    lidiaFields.termgroups.length === 0 && 
                                    <><br /><button style={{margin: "5px 0 0 0"}} type="button" disabled={takeTermsFromPreviousDisabled} onClick={takeTermsFromPrevious}>Take from previous annotation</button></>
                                }
                            </div>
                        </div>



                    </fieldset>
                }
            </form>
        </div>
    );
}

export default AnnotationForm;
