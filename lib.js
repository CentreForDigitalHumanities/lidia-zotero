if (!Zotero.Lidia) {
	Zotero.Lidia = {
		log(msg) {
			Zotero.debug("\033[47m\033[1;31mLIDIA extension:\033[0m " + msg);
		},

		init() {
			log('Initializing LIDIA extension');
		}
	};
}
