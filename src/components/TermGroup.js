import React, { useState } from 'react';

import lexiconTerms from '../../content/lexicon.json';

const TermGroup = ({ value, onChange }) => {
    // Set default value - cleaner way possible?
    if (!value.lexiconterm) {
        value.lexiconterm = '';
    }
    if (!value.category) {
        value.category = '';
    }
    if (!value.termtype) {
        value.termtype = "";
    }
    if (!value.articleterm) {
        value.articleterm = "";
    }
    if (!value.customterm) {
        value.customterm = "";
    }
    const [termGroupObj, setTermGroupObj] = useState(value);

    const findFilteredLexiconTerms = (category) => {
        return lexiconTerms.entries.filter((lexiconterm) => {
            return lexiconterm.category === category;
        });
    }

    const handleChange = (event) => {
        setTermGroupObj((prevState) => {
            const newTermGroupObj = { ...prevState, [event.target.name]: event.target.value };
            onChange(newTermGroupObj);
            return newTermGroupObj;
        });
        if (event.target.name === "category") {
            const _filteredLexiconTerms = findFilteredLexiconTerms(event.target.value);
            setFilteredLexiconTerms(_filteredLexiconTerms);
        }
    };

    const [filteredLexiconTerms, setFilteredLexiconTerms] = useState(findFilteredLexiconTerms(value.category));

    const fullWidthStyle = {
        width: '92%',
    };

    // Only show the custom term input box if custom is selected from term list
    const customVisible = termGroupObj.lexiconterm === 'custom';

    return (
        <div>
            <div style={{display: "inline-block", margin: "0 5px 0 0"}}>
                <label htmlFor="termtype" style={{display: "block"}}>Term type:</label>
                <select name="termtype" value={termGroupObj.termtype} onChange={handleChange}>
                    <option value="">Undefined</option>
                    <option value="definiendum">Definiendum</option>
                    <option value="definiens">Definiens</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div style={{display: "inline-block", margin: "0 5px 0 0"}}>
                <label htmlFor="articleterm" style={{display: "block"}}>Article term:</label>
                <input name="articleterm" type="text" value={termGroupObj.articleterm} onChange={handleChange}/>
            </div>

            <div style={{display: "inline-block", margin: "0 5px 0 0"}}>
                <label style={{display: "block"}} htmlFor="lexiconterm">Lexicon term:</label>
                <select name="category" value={termGroupObj.category} style={{margin: "0 5px 0 0"}} onChange={handleChange}>
                    <option value="">(Choose a category)</option>
                    {Object.keys(lexiconTerms.categories).map((slug) => (
                        <option key={slug} value={slug}>
                            {lexiconTerms.categories[slug]}
                        </option>
                        ))
                    }
                </select>
                <select name="lexiconterm" value={termGroupObj.lexiconterm} onChange={handleChange}>
                    <option value="">(Choose a term)</option>
                    {filteredLexiconTerms.map((option) => (
                        <option key={option.slug} value={option.slug} disabled={!option.selectable}>
                            {option.display}
                        </option>
                    ))}
                    <option value="custom">(Custom)</option>
                </select>
            </div>

            {customVisible && 
                <div style={{display: "inline-block", margin: "0 5px 0 0", visibility: customVisible}}>
                    <label stype={{marginTop: '5px'}} htmlFor="customterm">Custom term:</label>
                    <input type="text" style={fullWidthStyle} name="customterm" value={termGroupObj.customterm} onChange={handleChange} />
                </div>
            }
        </div>
    )
}

export default TermGroup;
