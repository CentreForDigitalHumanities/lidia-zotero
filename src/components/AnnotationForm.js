import React from 'react';
import { useState } from "react";

// This works because we're using esbuild?
// Note: a SQLite file would be ~2.5 times smaller than this JSON
import lexiconOfLinguistics from './lexiconTerms.json';


const AnnotationForm = (props) => {
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
                                <select name="lexiconterm" value={lidiaFields.lexiconterm || null} onChange={handleChange}>
                                    {filteredLexiconTerms.map((option) => (
                                        <option key={option.key} value={option.lemma}>
                                            {option.term}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={labelStyle}>
                                <label htmlFor="description">Short description:</label>
                            </div>

                            <div>
                                <textarea name="description" style={fullWidthStyle} rows="5" value={lidiaFields.description} onChange={handleChange} />
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
