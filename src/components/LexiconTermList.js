import React, { useState, useEffect } from 'react';

import LexiconTermField from './LexiconTermField';

const LexiconTermList = (props) => {
    const [terms, setTerms] = useState([]);
//    log(terms); <- terms is undefined
    const lexiconTermItems = terms.map((lexiconTerm) => {
        return <LexiconTermField
            value={lexiconTerm}
            onChange={() => {
                // Nog in te vullen
                ;
            }}
        />
    });

    const addTermHandler = () => {
        setTerms((prevState) => {
            const newItem = {
                linglevel: '',
                lexiconterm: '',
                customterm: ''
            };
            return [...prevState, newItem]
        });
    }

    return (
        <div>
            { lexiconTermItems }
            <button onClick={addTermHandler()}>Add Term</button>
        </div>
    );
}

export default LexiconTermList;
