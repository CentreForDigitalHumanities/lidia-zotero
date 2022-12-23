if (!Zotero.Lidia) {
    Zotero.Lidia = {
        log(msg) {
            Zotero.debug("\033[47m\033[1;31mLIDIA extension:\033[0m " + msg);
        },

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
