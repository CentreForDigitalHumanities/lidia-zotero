if (!Zotero.Lidia) {
    Zotero.Lidia = {
        async init(rootURI) {
            log('Initializing LIDIA extension');
            this.rootURI = rootURI;
            this.win = Zotero.getMainWindow();
            this.stringBundle = Services.strings.createBundle('chrome://lidia-annotations/locale/lidia.properties');
            Services.scriptloader.loadSubScript(this.rootURI + 'panel.js');
            Services.scriptloader.loadSubScript(this.rootURI + 'selecting.js');
            Services.scriptloader.loadSubScript(this.rootURI + 'serialize.js');
            this.Panel.initialize();
        },
    };
}
