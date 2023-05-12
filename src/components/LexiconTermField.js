import React, { useState, useEffect } from 'react';

// This works because we're using esbuild?
// Note: a SQLite file would be ~2.5 times smaller than this JSON
import lexiconOfLinguistics from './lexiconTerms.json';

const LexiconTermField = (props) => {
    log("Props: \n" + JSON.stringify(props, space=2));
    // TODO: ungroup the subfields and duplicate terms across individual subfields
    const linguisticLevels = ["", "All", "Syntax","Phonetics","Morphology","Phonology","Semantics","General","Phonology; Phonetics","Morphology; Syntax","Phonology; Morphology","Syntax; Semantics","Morphology; Semantics"];
    log(JSON.stringify(props.value));
    const [linguisticLevel, setLinguisticLevel] = useState(
        props.value.linglevel
    );
    const [filteredLexiconTerms, setFilteredLexiconTerms] = useState(
        lexiconOfLinguistics
    );
    const [lexiconTerm, setLexiconTerm] = useState(
        props.value.lexiconterm
    );
    const [customTerm, setCustomTerm] = useState(
        props.value.customterm
    );

    useEffect(() => {
        props.onChange({
            linglevel: linguisticLevel,
            lexiconterm: lexiconTerm,
            customterm: customTerm
        });
    }, [linguisticLevel, lexiconTerm, customTerm]);

    useEffect(() => {
        setLinguisticLevel(props.value.linglevel);
        setLexiconTerm(props.value.lexiconterm);
        setCustomTerm(props.value.customterm);
    }, [props.value]);

    const labelStyle = {
        marginTop: '5px',
    }

    const fullWidthStyle = {
        width: '92%',
    }

    const handleLinguisticLevelSelect  = (event) => {
        setLinguisticLevel(event.target.value);
        if (event.target.value === "All") {
            setFilteredLexiconTerms(lexiconOfLinguistics);
        } else {
            const _filteredLexiconTerms = lexiconOfLinguistics.filter(
                (lexiconterm) => {
                    return lexiconterm.subfield === event.target.value;
                }
            );
            setFilteredLexiconTerms(_filteredLexiconTerms);
        }
    }

    const handleLexiconTermSelect = (event) => {
        setLexiconTerm(event.target.value);
    }

    const handleCustomTermChange = (event) => {
        setCustomTerm(event.target.value);
    }

    return (
        <div>
            <div style={{margin: "5px"}}>
                <label style={{display: "block"}} htmlFor="linglevel">Linguistic level</label>
                <select style={{margin: "0 5px 0 0"}} value={linguisticLevel || null} onChange={handleLinguisticLevelSelect}>
                    {linguisticLevels.map((subfield) => (
                        <option key={subfield} value={subfield}>
                            {subfield}
                        </option>
                        ))
                    }
                </select>
                <label style={{display: "block"}} htmlFor="lexiconterm">Lexicon term</label>
                <select name="lexiconterm" value={lexiconTerm || null} onChange={handleLexiconTermSelect}>
                    {filteredLexiconTerms.map((option) => (
                        <option key={option.key} value={option.lemma}>
                            {option.term}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="customterm" style={{marginTop: '5px'}}>Custom term:</label>
                <input type="text" style={fullWidthStyle} name="customterm" value={customTerm} onChange={handleCustomTermChange} />
            </div>
        </div>
    )
}

export default LexiconTermField;
