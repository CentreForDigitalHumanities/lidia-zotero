if (!Zotero.Lidia) {
	Zotero.Lidia = {
		log(msg) {
			Zotero.debug("\033[47m\033[1;31mLIDIA extension:\033[0m " + msg);
		},

		async init() {
			log('Initializing LIDIA extension');
			this.win = Zotero.getMainWindow();
			this.stringBundle = Services.strings.createBundle('chrome://lidia-annotations/locale/lidia.properties');
			this.notifierCallback = {
				// Call view.updateTranslatePanels when a tab is added or selected
				notify: async (
					event,
					type,
					ids,
					extraData
				) => {
					if (
					event == "select" &&
					type == "tab" &&
					extraData[ids[0]].type == "reader"
					) {
						log("open PDF reader event detected.");
						let reader = Zotero.Reader.getByTabID(ids[0]);
						let delayCount = 0;
						while (!reader && delayCount < 10) {
							await Zotero.Promise.delay(100);
							reader = Zotero.Reader.getByTabID(ids[0]);
							delayCount++;
						}
						await reader._initPromise;
						this.onReaderSelect(reader);
					}
				}
			}

			let notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, [
				"tab",
				"item",
				"file",
			]);
		},

		async onReaderSelect(reader) {
			log("Reader selected, now build the sidebar tab");
			const item = Zotero.Items.get(reader.itemID);
			log(
				"We are in file: " + `${item.getField("title")}`
			);
			this.buildSideBarPanel();
		},

		async buildSideBarPanel() {
			let tab = this.tab;
			if (!tab) {
				tab = this.win.document.createElement("tab");
				tab.setAttribute("id", "pdf-translate-tab");
				tab.setAttribute(
					"label",
					'LIDIA'
				);
				this.tab = tab;
			}
			let tabContainer = this.win.document.getElementById(`${this.win.Zotero_Tabs._selectedID}-context`);
			let n = 0;
			while (!tabContainer || !tabContainer.querySelector("tabbox")) {
				if (n >= 500) {
					Zotero.debug("ZoteroPDFTranslate: Waiting for reader failed");
					return;
				}
				// For attachments without parent item
				if (tabContainer.querySelector("description")) {
					tabContainer.innerHTML = "";
					const tabbox = window.document.createElement("tabbox");
					tabbox.className = "zotero-view-tabbox";
					tabbox.setAttribute("flex", "1");

					const tabs = window.document.createElement("tabs");
					tabs.className = "zotero-editpane-tabs";
					tabs.setAttribute("orient", "horizontal");
					tabbox.append(tabs);

					const tabpanels = window.document.createElement("tabpanels");
					tabpanels.className = "zotero-view-item";
					tabpanels.setAttribute("flex", "1");

					tabbox.append(tabpanels);
					tabContainer.append(tabbox);
					break;
				}
				await Zotero.Promise.delay(10);
				n++;
			}
			tabContainer = this.win.document.getElementById(`${this.win.Zotero_Tabs._selectedID}-context`);
			const tabbox = tabContainer.querySelector("tabbox");
			tabbox.querySelector("tabs").appendChild(tab);

			let panelInfo = this.tabPanel;
			if (!panelInfo) {
				panelInfo = this.win.document.createElement("tabpanel");
				panelInfo.setAttribute("id", "lidia-tabpanel");
				panelInfo.setAttribute("flex", "1");
				let vbox = this.buildTranslatePanel(this.win);

				let hboxOpenWindow = this.win.document.createElement("hbox");
				hboxOpenWindow.setAttribute(
					"id",
					"pdf-translate-tabpanel-openwindow-hbox"
				);
				hboxOpenWindow.setAttribute("flex", "1");
				hboxOpenWindow.setAttribute("align", "center");
				hboxOpenWindow.maxHeight = 50;
				hboxOpenWindow.minHeight = 50;
				hboxOpenWindow.style.height = "80px";

				let buttonAbout = this.win.document.createElement("button");
				buttonAbout.setAttribute(
					"label",
					this.stringBundle.GetStringFromName('lidiaAbout.label')
				);
				buttonAbout.setAttribute("flex", "1");
				/*buttonOpenWindow.addEventListener("click", (e) => {
					this._Addon.events.onOpenStandaloneWindow();
				});*/

				hboxOpenWindow.append(buttonAbout);
				vbox.append(hboxOpenWindow);

				panelInfo.append(vbox);
				this.tabPanel = panelInfo;
			}
			tabbox.querySelector("tabpanels").appendChild(panelInfo);
tabbox.selectedIndex = Array.prototype.indexOf.call(
        tabbox.querySelector("tabs").childNodes,
        tabbox.querySelector("#pdf-translate-tab")
      );

		},

		buildTranslatePanel(_window) {
			let vbox = _window.document.createElement("vbox");
			vbox.setAttribute("id", "pdf-translate-vbox");
			vbox.setAttribute("flex", "1");
			vbox.setAttribute("align", "stretch");
			vbox.style.padding = "0px 10px 10px 10px";
			return vbox;
		}
	};
}
