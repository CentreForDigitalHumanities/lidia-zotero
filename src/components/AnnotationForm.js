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

// This works because we're using esbuild?
import vocabularyTerms from '../../content/vocabulary.json';

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
        linglevel: props.data.linglevel,
        lexiconterm: props.data.lexiconterm,
        customterm: props.data.customterm,
        termgroups: props.data.termgroups,
        arglang: props.data.arglang,
        description: props.data.description,
        relationType: props.data.relationType,
        relationTo: props.data.relationTo,
        annotationKey: props.data.annotationKey
    });

    // TODO: default values aren´t checked to be valid
    const defaultArgLevel = props.defaults.arglevel || null;

    const subfields = ["All", "General", "Morphology", "Phonetics", "Phonology", "Semantics", "Syntax"];
    const [lexiconTermSubfield, setLexiconTermSubfield] = useState(defaultArgLevel || "All");
    const [filteredLexiconTerms, setFilteredLexiconTerms] = useState(vocabularyTerms);


    const onLexiconTermSubfieldChange  = (event) => {
        setLexiconTermSubfield(event.target.value);
        if (event.target.value === "All") {
            setFilteredLexiconTerms(vocabularyTerms);
        } else {
            const _filteredLexiconTerms = vocabularyTerms.filter((lexiconterm) => {
                return lexiconterm.linglevels.includes(event.target.value);
            });
            setFilteredLexiconTerms(_filteredLexiconTerms);
        }
    }

    const defaultTermGroup = {
        termtype: '',
        articleterm: '',
        category: '',
        lexiconterm: '',
        customterm: ''
    };

    const addTermGroup = (index) => {
        setLidiaFields((prevState) => {
            const newTermGroups = [...prevState.termgroups, defaultTermGroup]
            return { ...prevState, 'termgroups': newTermGroups }
        });
    }

    const removeLastTermGroup = (index) => {
        setLidiaFields((prevState) => {
            const newTermGroups = prevState.termgroups.slice(0, -1);
            return { ...prevState, 'termgroups': newTermGroups }
        });
    }

    const handleTermGroupChange = (index, newValue) => {
        const newTermGroups = [...lidiaFields.termgroups];
        newTermGroups[index] = newValue;
        setLidiaFields((prevState) => {
            return { ...prevState, 'termgroups': newTermGroups }
        });
    };

    React.useEffect(() => {
        setLidiaFields(props.data)
    }, [props.data]);

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
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        props.onSave(lidiaFields);
    }

    const handleToggleContinuation = (event) => {
        setLidiaFields((prevState) => {
            return { ...prevState, "argcont": event.target.checked}
        });
    }

    const dataWillBeOverwritten = () => {
        // If the annotation is set as a continuation while lidiaFields contains
        // any other data, this data will not be saved and will be lost.
        // This function is used to determine whether this warning should be
        // shown.
        if (lidiaFields.argcont) {
            for (const [key, value] of Object.entries(lidiaFields)) {
                if (key !== 'argcont' && value)
                    return true;
            }
            return false;
        } else {
            return false;
        }
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

    const annotationRefRows = [(<option value="">(none)</option>)];
    for (let annotation of props.annotations) {
        const display = annotation.documentTitle + ': ' + annotation.argname;
        annotationRefRows.push(<option value={annotation.zoteroKey}>{display}</option>);
    }

    return (
        <div style={divStyle}>
            <form onSubmit={handleSubmit}>
                <div style={fullWidthStyle}>
                    <input type="checkbox" id="continuation" name="continuation" checked={lidiaFields.argcont ? 1 : 0} onChange={handleToggleContinuation} disabled={(!props.previousAnnotationData) ? 1 : 0} />
                    <label htmlFor="continuation">Annotation is continuation of previous argument</label>
                </div>

                {props.data &&
                    <fieldset style={fullWidthStyle} disabled={lidiaFields.argcont}>
                        <div style={labelStyle}>Argument text:</div>

                        <div style={{fontSize: 'x-small'}}>{props.annotationText}</div>

                        <div className='lidia-annotation' style={formStyle} >

                            <div style={{marginTop: "1em", width: "92%"}}>
                                <div style={{display: "inline-block", margin: "5px;"}}>
                                    <label htmlFor="pagestart">Page start:</label>
                                    <input type="text" name="pagestart" value={getValue("pagestart")} onChange={handleChange} />
                                </div>

                                <div style={{margin: "5px", width: "92%"}}>
                                    <label htmlFor="pageend">Page end:</label>
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
                                <label htmlFor="linglevel">Linguistic level:</label>
                            </div>

                            <div>
                                <input type="text" style={fullWidthStyle} name="linglevel" value={getValue("linglevel")} onChange={handleChange} />
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="arglang" style={fullWidthStyle}>Language:</label>
                            </div>

                            <div>
                                <select name="arglang" value={getValue("arglang")} onChange={handleChange} >
                                    {languageRows}
                                </select>
                            </div>

                            <div>

                            </div>
                            <div style={{margin: "5px"}}>
                                <label style={{display: "block"}} htmlFor="lexiconterm">Lexicon term</label>
                                <select style={{margin: "0 5px 0 0"}} value={lexiconTermSubfield} onChange={onLexiconTermSubfieldChange}>
                                    {subfields.map((subfield) => (
                                        <option key={subfield} value={subfield}>
                                            {subfield}
                                        </option>
                                        ))
                                    }
                                </select>
                                <select name="lexiconterm" value={getValue("lexiconterm") || null} onChange={handleChange}>
                                    {filteredLexiconTerms.map((option) => (
                                        <option key={option.key} value={option.lemma}>
                                            {option.term}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="customterm" style={{marginTop: '5px'}}>Custom term:</label>
                                <input type="text" style={fullWidthStyle} name="customterm" value={getValue("customterm")} onChange={handleChange} />
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
                                <select name="relationType" style={{margin: "0 5px 0 0"}} value={getValue("relationType")} onChange={handleChange}>
                                    <option value="">(none)</option>
                                    <option value="contradicts">Contradicts</option>
                                    <option value="generalizes">Generalizes</option>
                                    <option value="invalidates">Invalidates</option>
                                    <option value="specialcase">Is a special case of</option>
                                    <option value="supports">Supports</option>
                                </select>
                                <select name="relationTo" style={{margin: "0 5px 0 0"}} value={getValue("relationTo")} onChange={handleChange}>
                                    {annotationRefRows}
                                </select>
                            </div>

                            <div>
                                <h3>Terms</h3>
                                {lidiaFields.termgroups.map((termGroup, index) => (
                                    <><h4>Term {index + 1}</h4><TermGroup
                                        key={lidiaFields.annotationKey + index}
                                        value={getTermGroupValue(index)}
                                        onChange={(newValue) => handleTermGroupChange(index, newValue)} /></>
                                ))}
                                <button style={{margin: "5px 0 0 0"}} type="button" onClick={addTermGroup}>Add more terms</button>
                                <button style={{margin: "5px 0 0 0"}} type="button" onClick={removeLastTermGroup}>Remove last term</button>
                            </div>
                        </div>



                    </fieldset>
                }
                <div>
                    <button type='submit'>Save</button>
                    { dataWillBeOverwritten() && <p><strong>Warning: saving will overwrite previously entered data!</strong></p> }
                </div>
            </form>
        </div>
    );
}

export default AnnotationForm;
