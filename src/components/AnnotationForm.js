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

// This works because we're using esbuild?
// Note: a SQLite file would be ~2.5 times smaller than this JSON
import lexiconOfLinguistics from './lexiconTerms.json';

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
        arglang: props.data.arglang,
        description: props.data.description,
        relationType: props.data.relationType,
        relationTo: props.data.relationTo,
    });

    // TODO: ungroup the subfields and duplicate terms across individual subfields
    const subfields = ["All", "Syntax","Phonetics","Morphology","Phonology","Semantics","General","Phonology; Phonetics","Morphology; Syntax","Phonology; Morphology","Syntax; Semantics","Morphology; Semantics"];
    const [lexiconTermSubfield, setLexiconTermSubfield] = useState("All");
    const [filteredLexiconTerms, setFilteredLexiconTerms] = useState(lexiconOfLinguistics);


    const onLexiconTermSubfieldChange  = (event) => {
        setLexiconTermSubfield(event.target.value);
        if (event.target.value === "All") {
            setFilteredLexiconTerms(lexiconOfLinguistics);
        } else {
            const _filteredLexiconTerms = lexiconOfLinguistics.filter((lexiconterm) => {
                return lexiconterm.subfield === event.target.value;
            });
            setFilteredLexiconTerms(_filteredLexiconTerms);
        }
    }

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

    const languageRows = [(<option value="">(undefined)</option>)];
    for (language of getLanguageList()) {
        // TODO: move out of function, because this happens with every render!
        languageRows.push(<option value={language[0]}>{language[0]} – {language[1]}</option>);
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
                    <label for="continuation">Annotation is continuation of previous argument</label>
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
