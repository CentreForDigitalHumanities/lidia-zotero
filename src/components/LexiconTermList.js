import React, { useState, useEffect } from 'react';

import LexiconTermField from './LexiconTermField';

const LexiconTermList = (props) => {
    const lexiconTerms = [
        { linglevel: 'Syntax', lexiconterm: 'A-position', customterm: '' }
    ]

    const lexiconTermItems = lexiconTerms.map((lexiconTerm) => {
        return <LexiconTermField value={lexiconTerm} onChange={() => {}} />
    });

    return (
        <div>
            { lexiconTermItems }
        </div>
    );
}

export default LexiconTermList;
