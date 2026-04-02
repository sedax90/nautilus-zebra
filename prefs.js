'use strict';

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class NautilusZebraPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        window.set_default_size(450, 500);

        const page = new Adw.PreferencesPage({
            title: _('Nautilus Zebra'),
            iconName: 'view-list-symbolic',
        });
        window.add(page);

        // --- Enable group ---
        const enableGroup = new Adw.PreferencesGroup({
            title: _('Zebra Striping'),
            description: _('Apply alternating colors to rows in Nautilus list view'),
        });
        page.add(enableGroup);

        const enableRow = new Adw.SwitchRow({
            title: _('Enable zebra striping'),
            subtitle: _('Requires Nautilus restart to apply'),
        });
        settings.bind('enabled', enableRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        enableGroup.add(enableRow);

        // --- Color group ---
        const colorGroup = new Adw.PreferencesGroup({
            title: _('Appearance'),
        });
        page.add(colorGroup);

        // Color picker
        const colorRow = new Adw.ActionRow({
            title: _('Row color'),
            subtitle: _('Choose the color of alternating rows'),
        });

        const colorButton = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
        });
        const colorDialog = new Gtk.ColorDialog({
            title: _('Choose zebra color'),
        });
        colorButton.set_dialog(colorDialog);

        // Load current color
        const currentColorStr = settings.get_string('stripe-color');
        const currentColor = new Gdk.RGBA();
        currentColor.parse(currentColorStr);
        colorButton.set_rgba(currentColor);

        colorButton.connect('notify::rgba', () => {
            const rgba = colorButton.get_rgba();
            const r = Math.round(rgba.red * 255);
            const g = Math.round(rgba.green * 255);
            const b = Math.round(rgba.blue * 255);
            const a = rgba.alpha.toFixed(3);
            settings.set_string('stripe-color', `rgba(${r},${g},${b},${a})`);
        });

        colorRow.add_suffix(colorButton);
        colorGroup.add(colorRow);

        // Opacity slider
        const opacityRow = new Adw.ActionRow({
            title: _('Opacity'),
            subtitle: `${settings.get_int('opacity')}%`,
        });

        const opacityScale = Gtk.Scale.new_with_range(
            Gtk.Orientation.HORIZONTAL, 1, 30, 1
        );
        opacityScale.set_value(settings.get_int('opacity'));
        opacityScale.set_size_request(200, -1);
        opacityScale.set_valign(Gtk.Align.CENTER);
        opacityScale.set_draw_value(false);

        opacityScale.connect('value-changed', () => {
            const val = Math.round(opacityScale.get_value());
            settings.set_int('opacity', val);
            opacityRow.set_subtitle(`${val}%`);
        });

        opacityRow.add_suffix(opacityScale);
        colorGroup.add(opacityRow);

        // --- Preview group ---
        const previewGroup = new Adw.PreferencesGroup({
            title: _('Preview'),
        });
        page.add(previewGroup);

        const previewBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            cssClasses: ['card'],
            overflow: Gtk.Overflow.HIDDEN,
        });

        const buildPreview = () => {
            let child = previewBox.get_first_child();
            while (child) {
                const next = child.get_next_sibling();
                previewBox.remove(child);
                child = next;
            }

            const enabled = settings.get_boolean('enabled');
            const opacity = settings.get_int('opacity');
            const colorStr = settings.get_string('stripe-color');
            const rgba = new Gdk.RGBA();
            rgba.parse(colorStr);

            const files = [
                ['folder-symbolic', _('Documents'), _('Folder'), '12 mar'],
                ['folder-symbolic', _('Images'), _('Folder'), '28 feb'],
                ['text-x-generic-symbolic', 'note.txt', '1,2 kB', '1 apr'],
                ['application-pdf-symbolic', 'report.pdf', '3,4 MB', '15 mar'],
                ['audio-x-generic-symbolic', 'musica.mp3', '5,1 MB', '10 gen'],
                ['image-x-generic-symbolic', 'foto.jpg', '2,8 MB', '22 mar'],
            ];

            for (let i = 0; i < files.length; i++) {
                const [iconName, name, size, date] = files[i];
                const row = new Gtk.Box({
                    orientation: Gtk.Orientation.HORIZONTAL,
                    spacing: 10,
                    marginStart: 12,
                    marginEnd: 12,
                    marginTop: 6,
                    marginBottom: 6,
                });

                if (enabled && i % 2 === 1) {
                    const r = Math.round(rgba.red * 255);
                    const g = Math.round(rgba.green * 255);
                    const b = Math.round(rgba.blue * 255);
                    const a = (opacity / 100).toFixed(3);
                    const provider = new Gtk.CssProvider();
                    provider.load_from_string(
                        `box { background-color: rgba(${r},${g},${b},${a}); }`
                    );
                    row.get_style_context().add_provider(
                        provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
                    );
                }

                const icon = Gtk.Image.new_from_icon_name(iconName);
                icon.set_pixel_size(18);
                row.append(icon);

                const nameLabel = new Gtk.Label({
                    label: name,
                    xalign: 0,
                    hexpand: true,
                });
                row.append(nameLabel);

                const sizeLabel = new Gtk.Label({
                    label: size,
                    xalign: 1,
                    cssClasses: ['dim-label'],
                    widthRequest: 70,
                });
                row.append(sizeLabel);

                const dateLabel = new Gtk.Label({
                    label: date,
                    xalign: 1,
                    cssClasses: ['dim-label'],
                    widthRequest: 60,
                });
                row.append(dateLabel);

                previewBox.append(row);
            }
        };

        buildPreview();

        settings.connect('changed', () => buildPreview());

        previewGroup.add(previewBox);

        // --- Reset group ---
        const resetGroup = new Adw.PreferencesGroup();
        page.add(resetGroup);

        const resetRow = new Adw.ActionRow({
            title: _('Reset to defaults'),
            subtitle: _('Gray color, 5% opacity'),
        });

        const resetButton = new Gtk.Button({
            iconName: 'edit-undo-symbolic',
            valign: Gtk.Align.CENTER,
            cssClasses: ['flat'],
        });
        resetButton.connect('clicked', () => {
            settings.reset('stripe-color');
            settings.reset('opacity');
            settings.reset('enabled');

            const defColor = new Gdk.RGBA();
            defColor.parse(settings.get_string('stripe-color'));
            colorButton.set_rgba(defColor);
            opacityScale.set_value(settings.get_int('opacity'));
            opacityRow.set_subtitle(`${settings.get_int('opacity')}%`);
        });
        resetRow.add_suffix(resetButton);
        resetGroup.add(resetRow);

        // --- Info group ---
        const infoGroup = new Adw.PreferencesGroup();
        page.add(infoGroup);

        const infoRow = new Adw.ActionRow({
            title: _('Note'),
            subtitle: _('Changes are applied when Nautilus restarts.\nUse the quick toggle in the panel to enable/disable.'),
            subtitleLines: 3,
            iconName: 'dialog-information-symbolic',
        });
        infoGroup.add(infoRow);
    }
}
