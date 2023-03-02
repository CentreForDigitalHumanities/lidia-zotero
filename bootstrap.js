// Bootstrapped plugin for Zotero 6 and 7
// Following https://github.com/zotero/make-it-red/tree/main/src-1.2

var stylesheetID = 'lidia-stylesheet';
var ftlID = 'lidia-ftl';
var menuitemID = 'lidia-about';
var addedElementIDs = [stylesheetID, ftlID, menuitemID];

if (typeof Zotero == 'undefined') {
	var Zotero;
}

function log(msg) {
    Zotero.debug("\033[47m\033[1;31mLIDIA extension:\033[0m " + msg);
}

function getString(name) {
    let stringBundle = Services.strings.createBundle('chrome://lidia-annotations/locale/lidia.properties');
    let str = undefined;
    try {
        str = stringBundle.GetStringFromName(name);
    } catch (e) {
        log(`Error finding localized string ${name}`);
        str = name;
    }
    return str;
}

/**
 * Create an HTML element according to the Mozilla platform version
 */
function createHElement(type) {
    const win = Zotero.getMainWindow();
    let element;
    if (Zotero.platformMajorVersion < 102) {
        element = win.document.createElementNS("http://www.w3.org/1999/xhtml", type);
    } else {
        element = win.document.createElement(type);
    }
    return element;
}

/**
 * Create an XUL element according to the Mozilla platform version
 */
function createXElement(type) {
    const win = Zotero.getMainWindow();
    let element;
    if (Zotero.platformMajorVersion < 102) {
        element = win.document.createElement(type);
    } else {
        element = win.document.createXULElement(type);
    }
    return element;
}


// In Zotero 6, bootstrap methods are called before Zotero is initialized, and using include.js
// to get the Zotero XPCOM service would risk breaking Zotero startup. Instead, wait for the main
// Zotero window to open and get the Zotero object from there.
//
// In Zotero 7, bootstrap methods are not called until Zotero is initialized, and the 'Zotero' is
// automatically made available.
async function waitForZotero() {
	if (typeof Zotero != 'undefined') {
		await Zotero.initializationPromise;
	}

	var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
	var windows = Services.wm.getEnumerator('navigator:browser');
	var found = false;
	while (windows.hasMoreElements()) {
		let win = windows.getNext();
		if (win.Zotero) {
			Zotero = win.Zotero;
			found = true;
			break;
		}
	}
	if (!found) {
		await new Promise((resolve) => {
			var listener = {
				onOpenWindow: function (aWindow) {
					// Wait for the window to finish loading
					let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
						.getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
					domWindow.addEventListener("load", function () {
						domWindow.removeEventListener("load", arguments.callee, false);
						if (domWindow.Zotero) {
							Services.wm.removeListener(listener);
							Zotero = domWindow.Zotero;
							resolve();
						}
					}, false);
				}
			};
			Services.wm.addListener(listener);
		});
	}
	await Zotero.initializationPromise;
	return;
}

async function install() {
	await waitForZotero();

	log("Installed");
}

async function startup({ id, version, resourceURI, rootURI = resourceURI.spec }) {
	await waitForZotero();
	
	log("Starting");
	
	// 'Services' may not be available in Zotero 6
	if (typeof Services == 'undefined') {
		var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
	}

	// Add DOM elements to the main Zotero pane
	var win = Zotero.getMainWindow();
	if (win && win.ZoteroPane) {
		let zp = win.ZoteroPane;
		let doc = win.document;
		// createElementNS() necessary in Zotero 6; createElement() defaults to HTML in Zotero 7
		let HTML_NS = "http://www.w3.org/1999/xhtml";
		let XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
		let stylesheetLink = doc.createElementNS(HTML_NS, 'link');
		stylesheetLink.id = stylesheetID;
		stylesheetLink.type = 'text/css';
		stylesheetLink.rel = 'stylesheet';
		stylesheetLink.href = rootURI + 'style.css';
		doc.documentElement.appendChild(stylesheetLink);

		let menuitem = doc.createElementNS(XUL_NS, 'menuitem');
		menuitem.id = menuitemID;
		doc.getElementById('menu_HelpPopup').appendChild(menuitem);

		// Use strings from lidia.properties (legacy properties format) in Zotero 6
		// and from lidia.ftl (Fluent) in Zotero 7
		if (Zotero.platformMajorVersion < 102) {
			let stringBundle = Services.strings.createBundle('chrome://lidia-annotations/locale/lidia.properties');
			Zotero.getMainWindow().document.getElementById('lidia-about')
				.setAttribute('label', stringBundle.GetStringFromName('lidiaAbout.label'));
		}
		else {
			let ftlLink = doc.createElementNS(HTML_NS, 'link');
			ftlLink.id = ftlID;
			ftlLink.rel = 'localization';
			ftlLink.href = 'lidia.ftl';
			doc.documentElement.appendChild(ftlLink);
		}
	}

	Services.scriptloader.loadSubScript(rootURI + 'out.js');

	await Zotero.Lidia.init(rootURI);
}

function shutdown() {
	log("Shutting down...");

	// Remove stylesheet
	var zp = Zotero.getActiveZoteroPane();
	if (zp) {
		for (let id of addedElementIDs) {
			// ?. (null coalescing operator) not available in Zotero 6
			let elem = zp.document.getElementById(id);
			if (elem) elem.remove();
		}
	}
}

function uninstall() {
	// `Zotero` object isn't available in `uninstall()` in Zotero 6, so log manually
	if (typeof Zotero == 'undefined') {
		dump("LIDIA: Uninstalled\n\n");
		return;
	}

	log("Uninstalled");
}
