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

Gio._promisify(Gio.File.prototype, 'load_contents_async', 'load_contents_finish');
Gio._promisify(Gio.File.prototype, 'replace_contents_async', 'replace_contents_finish');

function stripZebraBlock(content) {
    const startIdx = content.indexOf(MARKER_START);
    const endIdx = content.indexOf(MARKER_END);
    if (startIdx === -1 || endIdx === -1)
        return null;

    const before = content.substring(0, startIdx).trimEnd();
    const after = content.substring(endIdx + MARKER_END.length).trimStart();
    let result = before;
    if (after) {
        if (result)
            result += '\n\n';
        result += after;
    }
    return result;
}

async function readCSSFile() {
    const file = Gio.File.new_for_path(CSS_FILE);
    try {
        const [contents] = await file.load_contents_async(null);
        return new TextDecoder().decode(contents);
    } catch (e) {
        return '';
    }
}

async function writeCSSFile(text) {
    const file = Gio.File.new_for_path(CSS_FILE);
    await file.replace_contents_async(
        new TextEncoder().encode(text),
        null, false, Gio.FileCreateFlags.NONE, null);
}

async function removeCSS() {
    const content = await readCSSFile();
    if (!content)
        return;

    const result = stripZebraBlock(content);
    if (result === null)
        return;

    await writeCSSFile(result);
}

async function applyCSS(settings) {
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
    const parity = settings.get_boolean('start-on-even') ? 'even' : 'odd';

    const zebraCSS = `${MARKER_START}
/* Zebra striping for Nautilus list view */
.nautilus-list-view columnview > listview > row:nth-child(${parity}):not(:selected):not(:hover):not(:active) {
    background-color: rgba(${r},${g},${b},${a});
}
${MARKER_END}`;

    const dir = GLib.get_home_dir() + '/.config/gtk-4.0';
    GLib.mkdir_with_parents(dir, 0o755);

    let content = await readCSSFile();

    // Strip existing zebra CSS
    const stripped = stripZebraBlock(content);
    if (stripped !== null)
        content = stripped;

    if (enabled) {
        if (content.trim())
            content = content.trimEnd() + '\n\n' + zebraCSS + '\n';
        else
            content = zebraCSS + '\n';
    }

    await writeCSSFile(content);

    try {
        Gio.Subprocess.new(['nautilus', '-q'], Gio.SubprocessFlags.NONE);
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
            applyCSS(this._settings).catch(console.error);
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
            applyCSS(this._settings).catch(console.error);

        this._settingsChangedId = this._settings.connect('changed', () => {
            applyCSS(this._settings).catch(console.error);
        });
    }

    disable() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        // Remove CSS when extension is disabled and restart Nautilus
        removeCSS().then(() => {
            try {
                Gio.Subprocess.new(['nautilus', '-q'], Gio.SubprocessFlags.NONE);
            } catch (e) {
                // Nautilus may not be running
            }
        }).catch(console.error);

        this._indicator?.destroy();
        this._indicator = null;
        this._settings = null;
    }
}
