if (!Zotero.Lidia) {
	// Global properties are imported in Zotero 6 and included automatically in Zotero 7
	if (Zotero.platformMajorVersion < 102) {
		// Cu.importGlobalProperties(['URL']);
	}

	Zotero.Lidia = {
		log(msg) {
			Zotero.debug("LIDIA: " + msg);
		},

	};
}
