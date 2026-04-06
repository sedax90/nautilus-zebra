UUID = nautilus-zebra@cristian
EXT_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)
LANGS = it en fr de es zh

.PHONY: install uninstall compile-schemas compile-locales

compile-schemas:
	glib-compile-schemas schemas/

compile-locales:
	@for lang in $(LANGS); do \
		msgfmt locale/$$lang/LC_MESSAGES/nautilus-zebra.po \
			-o locale/$$lang/LC_MESSAGES/nautilus-zebra.mo && \
		echo "  $$lang OK"; \
	done

install: compile-schemas compile-locales
	@echo "Installing $(UUID)..."
	@mkdir -p $(EXT_DIR)
	cp metadata.json extension.js prefs.js $(EXT_DIR)/
	cp -r schemas $(EXT_DIR)/
	cp -r locale $(EXT_DIR)/
	@echo ""
	@echo "Installazione completata!"
	@echo "Fai logout/login, poi attiva l'estensione in Extension Manager."

uninstall:
	@echo "Removing $(UUID)..."
	rm -rf $(EXT_DIR)
	@echo "Disinstallazione completata."
