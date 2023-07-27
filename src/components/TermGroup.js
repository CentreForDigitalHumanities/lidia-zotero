import React, { useState } from 'react';

import vocabularyTerms from '../../content/vocabulary.json';
import lexiconTerms from '../../content/lexicon.json';

const TermGroup = ({ value, onChange }) => {
    // Set default value - cleaner way possible?
    if (!value.lexiconterm) {
        value.lexiconterm = '[Custom]';
    }
    if (!value.category) {
        ; // TODO
    }
    const [termGroupObj, setTermGroupObj] = useState(value);

    const handleChange = (event) => {
        setTermGroupObj((prevState) => {
            log('Target name: ' + event.target.name);
            const newTermGroupObj = { ...prevState, [event.target.name]: event.target.value };
            onChange(newTermGroupObj);
            return newTermGroupObj;
        });
        if (event.target.name === "category") {
            const _filteredLexiconTerms = lexiconTerms.entries.filter((lexiconterm) => {
                return lexiconterm.category === event.target.value;
            });
            setFilteredLexiconTerms(_filteredLexiconTerms);
        }
    };

    // const defaultArgLevel = props.defaults.arglevel || null;
    const defaultArgLevel = null;
    const subfields = ["All", "General", "Morphology", "Phonetics", "Phonology", "Semantics", "Syntax"];
    const [filteredLexiconTerms, setFilteredLexiconTerms] = useState(lexiconTerms.entries);

    const fullWidthStyle = {
        width: '92%',
    };

    const customVisible = termGroupObj.lexiconterm === '[Custom]';

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

            <div style={{margin: "5px"}}>
                <label style={{display: "block"}} htmlFor="lexiconterm">Lexicon term</label>
                <select name="category" value={termGroupObj.category} style={{margin: "0 5px 0 0"}} onChange={handleChange}>
                    {Object.keys(lexiconTerms.categories).map((slug) => (
                        <option key={slug} value={slug}>
                            {lexiconTerms.categories[slug]}
                        </option>
                        ))
                    }
                </select>
                <select name="lexiconterm" value={termGroupObj.lexiconterm} onChange={handleChange}>
                    {filteredLexiconTerms.map((option) => (
                        <option key={option.slug} value={option.slug} disabled={!option.selectable}>
                            {option.display}
                        </option>
                    ))}
                </select>
            </div>

            {customVisible && 
                <div style={{visibility: customVisible}}>
                    <label stype={{marginTop: '5px'}} htmlFor="customterm">Custom term:</label>
                    <input type="text" style={fullWidthStyle} name="customterm" value={termGroupObj.customterm} onChange={handleChange} />
                </div>
            }
        </div>
    )
}

export default TermGroup;
