if (!Zotero.Lidia.SelectButton) {
    Zotero.Lidia.SelectButton = {
        lidiaIcon: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
            <!-- Created with Inkscape (http://www.inkscape.org/) -->
            <svg
                width="5mm"
                height="5mm"
                viewBox="0 0 9.3120632 10.22156"
                version="1.1"
                id="svg5"
                inkscape:version="1.2.1 (9c6d41e410, 2022-07-14)"
                sodipodi:docname="lidia.svg"
                inkscape:export-filename="lidia.png"
                inkscape:export-xdpi="545.52899"
                inkscape:export-ydpi="545.52899"
                xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
                xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:svg="http://www.w3.org/2000/svg">
                <sodipodi:namedview
                    id="namedview7"
                    pagecolor="#ffffff"
                    bordercolor="#666666"
                    borderopacity="1.0"
                    inkscape:showpageshadow="2"
                    inkscape:pageopacity="0.0"
                    inkscape:pagecheckerboard="0"
                    inkscape:deskcolor="#d1d1d1"
                    inkscape:document-units="mm"
                    showgrid="false"
                    inkscape:zoom="6.2074635"
                    inkscape:cx="-13.693194"
                    inkscape:cy="20.942531"
                    inkscape:window-width="1920"
                    inkscape:window-height="995"
                    inkscape:window-x="0"
                    inkscape:window-y="0"
                    inkscape:window-maximized="1"
                    inkscape:current-layer="layer1" />
                <defs
                    id="defs2" />
                <g
                    inkscape:label="Laag 1"
                    inkscape:groupmode="layer"
                    id="layer1"
                    transform="translate(-54.124279,-136.59983)">
                    <g
                    id="g402">
                    <path
                        style="font-size:10.5833px;line-height:1.25;font-family:'Linux Biolinum Keyboard';-inkscape-font-specification:'Linux Biolinum Keyboard';fill:#008000;stroke-width:0.264583"
                        d="m 63.436342,145.46748 q 0,0.72863 -0.284219,1.03869 -0.279052,0.31522 -0.976682,0.31522 h -6.686909 q -0.7183,0 -1.04386,-0.32556 -0.320393,-0.32039 -0.320393,-1.02835 v -7.5034 q 0,-0.65629 0.356566,-1.00769 0.361734,-0.35656 1.007687,-0.35656 h 6.371684 q 0.738971,0 1.157548,0.34106 0.418578,0.3359 0.418578,1.02319 z"
                        id="path398" />
                    <path
                        style="font-size:10.5833px;line-height:1.25;font-family:'Linux Biolinum Keyboard';-inkscape-font-specification:'Linux Biolinum Keyboard';fill:#ffffff;stroke-width:0.264583"
                        d="m 55.488532,136.98223 q -0.475421,0 -0.733803,0.25322 -0.253213,0.25321 -0.253213,0.72863 v 7.17784 q 0,0.87849 0.987016,0.87849 h 6.051291 q 0.475422,0 0.676959,-0.20154 0.201538,-0.20153 0.201538,-0.67695 v -7.17784 q 0,-0.98185 -0.878497,-0.98185 z"
                        id="path396" />
                    </g>
                    <path
                    style="font-size:10.5833px;line-height:1.25;font-family:'Linux Biolinum Keyboard';-inkscape-font-specification:'Linux Biolinum Keyboard';fill:#008000;stroke-width:0.264583"
                    d="m 58.04134,142.5581 q 0,0.85783 0.06201,1.09037 0.475422,0 1.033526,-0.0207 0.563271,-0.0207 0.888832,-0.0517 l 0.320392,-0.0258 0.01034,0.031 q -0.01034,0.062 -0.01034,0.26872 0,0.1912 0.01034,0.29455 l -0.01034,0.031 q -0.191202,-0.031 -0.475421,-0.031 h -2.340935 l -0.578774,0.031 v -0.031 q 0.07235,-0.49609 0.07235,-1.58646 v -1.93786 q 0,-0.99735 -0.08268,-1.58646 l 0.01034,-0.031 q 0.315225,0.031 0.578774,0.031 l 0.583942,-0.031 0.01033,0.031 q -0.08268,0.54777 -0.08268,1.58646 z"
                    id="path295" />
                </g>
            </svg>`,
        addButton: async function() {
            let updateCount = 0;
            let win = Zotero.getMainWindow();
            let reader = Zotero.Reader.getByTabID(win.Zotero_Tabs._selectedID);
            await reader._initPromise;
            const _document = reader._iframeWindow.document;
            for (const moreButton of _document.getElementsByClassName("more")) {
                if (moreButton.getAttribute("lidiainit") === "true") {
                    updateCount += 1;
                    continue;
                }
                log("Creating new LIDIA button");
                moreButton.setAttribute("lidiainit", "true");
                const translateAnnotationButton = _document.createElement("div");
                translateAnnotationButton.setAttribute("style", "margin: 5px;");
                translateAnnotationButton.innerHTML = this.lidiaIcon;

                let annotationWrapper = moreButton;
                while (!annotationWrapper.getAttribute("data-sidebar-annotation-id")) {
                    annotationWrapper = annotationWrapper.parentElement;
                }
                const itemKey = annotationWrapper.getAttribute(
                    "data-sidebar-annotation-id"
                );
                const libraryID = (Zotero.Items.get(reader.itemID))
                    .libraryID;
                const annotationItem = Zotero.Items.getByLibraryAndKeyAsync(
                    libraryID,
                    itemKey
                );

                translateAnnotationButton.addEventListener("click", (e) => {
                    this.onAnnotationActivated(annotationItem, true);
                    e.preventDefault();
                });
                annotationWrapper.addEventListener("click", (e) => {
                    this.onAnnotationActivated(annotationItem, true);
                    e.preventDefault();
                });
                translateAnnotationButton.addEventListener(
                    "mouseover",
                    (e) => {
                    translateAnnotationButton.setAttribute(
                        "style",
                        "background: #F0F0F0; margin: 5px;"
                    );
                    }
                );
                translateAnnotationButton.addEventListener(
                    "mouseout",
                    (e) => {
                    translateAnnotationButton.setAttribute("style", "margin: 5px;");
                    }
                );
                moreButton.before(translateAnnotationButton);
                updateCount += 1;
            }
        },
        onAnnotationActivated: async function(itemPromise, forceTranslate) {
            log("Annotation activated");
            itemPromise.then((item) => {
                Zotero.Lidia.Panel.receiveAnnotation(item);
            });
        }
    }
}
