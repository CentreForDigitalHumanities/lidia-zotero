import React from 'react';

function AnnotationForm(props) {
    // argname: lidiaArgumentName.label
    // linglevel: lidiaLinguisticLevel.label
    // arglang: lidiaArgumentLanguage.label
    // description: lidiaArgumentDescription.label

    const divStyle = {
        width: '100%',
        backgroundColor: 'red',
        display: 'flex',
    };

    return (
        <div style={divStyle}>
            <form>
                <div>{props.annotationText}</div>

                {!props.data &&
                    <div className='external-annotation'>
                        <p>External annotation</p>
                    </div>
                }

                {props.data &&
                    <fieldset disabled={props.disabled}>
                        <div className='lidia-annotation'>
                            <div>
                                <label htmlFor="argname">Argument name</label>
                                <input type="text" name="argname" value={props.data.argname}/>
                            </div>

                            <div>
                                <label htmlFor="linglevel">Linguistic level</label>
                                <input type="text" name="linglevel" value={props.data.linglevel}/>
                            </div>

                            <div>
                                <label htmlFor="argLanguage">TEST: Language</label>
                                <select name="argLanguage" value={props.data.arglang}>
                                    <option value="en">English</option>
                                    <option value="nl">Dutch</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="argdescription">Short description</label>
                                <input type="text" name="argdescription" value={props.data.description}/>
                            </div>

                        </div>
                    </fieldset>
                }
            </form>
        </div>
    );
}

export default AnnotationForm;
