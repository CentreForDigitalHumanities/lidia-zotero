import React from 'react';

function PleaseSelect(props) {
    const handleConvert = (event) => {
        props.onConvert();
    };

    const divStyle = {
        margin: '5px',
    };

    return (
        <div style={divStyle}>
            {props.status === 'external' &&
                <div>
                    <p>
                        This annotation belongs to the PDF file. If you
                        wish to convert it to a LIDIA annotation, first
                        import it into Zotero using <strong>File -&gt;
                        Import Annotations</strong>. (If this PDF file is part
                        of a group library, you may first have to move it to
                        a personal library.)
                    </p>
                </div>
            }

            {props.status === 'noselection' &&
                <div>
                    <p>
                        Please select an annotation or create a new annotation.
                    </p>
                </div>
            }

            {props.status === 'invalid' &&
                <div>
                    <p>
                        The annotation you selected is not a LIDIA annotation.
                        Please select a LIDIA annotation or create a new one.
                        {props.convertible &&
                            <span> Alternatively, you may try to convert it to
                            a LIDIA annotation using the button below.</span>
                        }
                        {!props.convertible &&
                            <span> Conversion to a LIDIA annotation is not
                            available because this annotation cannot be edited
                            by you.</span>
                        }
                    </p>
                    {props.convertible &&
                        <div><button onClick={handleConvert}>Convert to LIDIA annotation</button></div>
                    }
                </div>
            }
        </div>
    );
}

export default PleaseSelect;
