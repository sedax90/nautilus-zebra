'use strict';

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const CSS_FILE = GLib.get_home_dir() + '/.config/gtk-4.0/gtk.css';
const MARKER_START = '/* --- nautilus-zebra-start --- */';
const MARKER_END = '/* --- nautilus-zebra-end --- */';

function removeCSS() {
    let content = '';
    try {
        const [ok, data] = GLib.file_get_contents(CSS_FILE);
        if (ok)
            content = new TextDecoder().decode(data);
    } catch (e) {
        return;
    }

    const startIdx = content.indexOf(MARKER_START);
    const endIdx = content.indexOf(MARKER_END);
    if (startIdx === -1 || endIdx === -1)
        return;

    const before = content.substring(0, startIdx).trimEnd();
    const after = content.substring(endIdx + MARKER_END.length).trimStart();
    let result = before;
    if (after) {
        if (result)
            result += '\n\n';
        result += after;
    }

    GLib.file_set_contents(CSS_FILE, result);
}

function applyCSS(settings) {
    const enabled = settings.get_boolean('enabled');
    const color = settings.get_string('stripe-color');
    const opacity = settings.get_int('opacity');

    const rgbaMatch = color.match(/rgba?\((\d+),(\d+),(\d+)/);
    let r = 128, g = 128, b = 128;
    if (rgbaMatch) {
        r = parseInt(rgbaMatch[1]);
        g = parseInt(rgbaMatch[2]);
        b = parseInt(rgbaMatch[3]);
    }
    const a = (opacity / 100).toFixed(3);

    const zebraCSS = `${MARKER_START}
/* Zebra striping for Nautilus list view */
.nautilus-list-view columnview > listview > row:nth-child(even):not(:selected):not(:hover):not(:active) {
    background-color: rgba(${r},${g},${b},${a});
}
${MARKER_END}`;

    const dir = GLib.get_home_dir() + '/.config/gtk-4.0';
    GLib.mkdir_with_parents(dir, 0o755);

    let content = '';
    try {
        const [ok, data] = GLib.file_get_contents(CSS_FILE);
        if (ok)
            content = new TextDecoder().decode(data);
    } catch (e) {
        // File doesn't exist yet
    }

    // Strip existing zebra CSS
    const startIdx = content.indexOf(MARKER_START);
    const endIdx = content.indexOf(MARKER_END);
    if (startIdx !== -1 && endIdx !== -1) {
        const before = content.substring(0, startIdx).trimEnd();
        const after = content.substring(endIdx + MARKER_END.length).trimStart();
        content = before;
        if (after) {
            if (content)
                content += '\n\n';
            content += after;
        }
    }

    if (enabled) {
        if (content.trim())
            content = content.trimEnd() + '\n\n' + zebraCSS + '\n';
        else
            content = zebraCSS + '\n';
    }

    GLib.file_set_contents(CSS_FILE, content);

    try {
        GLib.spawn_command_line_async('nautilus -q');
    } catch (e) {
        // Nautilus may not be running
    }
}

const NautilusZebraToggle = GObject.registerClass(
class NautilusZebraToggle extends QuickSettings.QuickToggle {
    _init(settings) {
        super._init({
            title: 'Nautilus Zebra',
            iconName: 'view-list-symbolic',
            toggleMode: true,
        });

        this._settings = settings;

        settings.bind('enabled', this, 'checked',
            Gio.SettingsBindFlags.DEFAULT);

        this.connect('clicked', () => {
            applyCSS(this._settings);
        });
    }
});

const NautilusZebraIndicator = GObject.registerClass(
class NautilusZebraIndicator extends QuickSettings.SystemIndicator {
    _init(settings) {
        super._init();
        this.visible = false;

        this._settings = settings;

        this._toggle = new NautilusZebraToggle(settings);
        this.quickSettingsItems.push(this._toggle);
    }

    destroy() {
        this.quickSettingsItems.forEach(item => item.destroy());
        super.destroy();
    }
});

export default class NautilusZebraExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = new NautilusZebraIndicator(this._settings);

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);

        // Restore CSS if zebra was enabled
        if (this._settings.get_boolean('enabled'))
            applyCSS(this._settings);

        this._settingsChangedId = this._settings.connect('changed', () => {
            applyCSS(this._settings);
        });
    }

    disable() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        // Remove CSS when extension is disabled and restart Nautilus
        removeCSS();
        try {
            GLib.spawn_command_line_async('nautilus -q');
        } catch (e) {
            // Nautilus may not be running
        }

        this._indicator?.destroy();
        this._indicator = null;
        this._settings = null;
    }
}
