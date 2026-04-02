# Nautilus Zebra

A GNOME Shell extension that adds **zebra striping** (alternating row colors) to the Nautilus file manager list view.

![GNOME Shell](https://img.shields.io/badge/GNOME_Shell-45--49-blue?logo=gnome&logoColor=white)
![License](https://img.shields.io/badge/license-GPL--3.0-green)

## Features

- Alternating row colors in Nautilus list view
- **Quick Settings toggle** in the system panel — enable/disable without opening preferences
- **Color picker** — choose any color for the stripe
- **Opacity slider** — fine-tune intensity from 1% to 30%
- **Live preview** in the preferences window
- Preserves native **hover**, **selection**, and **drag** states
- Targets only Nautilus — other GTK4 apps are unaffected
- Translations: English, Italian, French, German, Spanish, Chinese

## How It Works

The extension injects a CSS rule into `~/.config/gtk-4.0/gtk.css` that targets Nautilus list view rows:

```css
.nautilus-list-view columnview > listview > row:nth-child(even):not(:selected):not(:hover):not(:active) {
    background-color: rgba(128, 128, 128, 0.05);
}
```

The CSS block is managed with start/end markers so it can be cleanly added and removed without interfering with your existing styles. Nautilus is automatically restarted when changes are applied.

## Installation

### From source

```bash
git clone https://github.com/sedax90/nautilus-zebra.git
cd nautilus-zebra

# Copy to extensions directory
mkdir -p ~/.local/share/gnome-shell/extensions/nautilus-zebra@cristian
cp -r extension.js prefs.js metadata.json LICENSE schemas/ locale/ \
    ~/.local/share/gnome-shell/extensions/nautilus-zebra@cristian/

# Compile schemas
glib-compile-schemas ~/.local/share/gnome-shell/extensions/nautilus-zebra@cristian/schemas/

# Compile translations
for po in locale/*/LC_MESSAGES/nautilus-zebra.po; do
    msgfmt "$po" -o "${po%.po}.mo"
done
```

Then log out and log back in (required on Wayland), and enable the extension:

```bash
gnome-extensions enable nautilus-zebra@cristian
```

### Uninstall

```bash
gnome-extensions disable nautilus-zebra@cristian
rm -rf ~/.local/share/gnome-shell/extensions/nautilus-zebra@cristian
```

## Usage

1. Open **Quick Settings** (click the system area in the top bar)
2. Toggle **Nautilus Zebra** on/off
3. To customize, open the extension preferences:
   ```bash
   gnome-extensions prefs nautilus-zebra@cristian
   ```

### CLI configuration

You can also change settings from the command line with `gsettings`:

```bash
# Enable/disable
gsettings set org.gnome.shell.extensions.nautilus-zebra enabled true

# Change color (RGBA format)
gsettings set org.gnome.shell.extensions.nautilus-zebra stripe-color 'rgba(0,100,200,0.05)'

# Change opacity (1-30)
gsettings set org.gnome.shell.extensions.nautilus-zebra opacity 8
```

## Project Structure

```
nautilus-zebra@cristian/
├── extension.js          # Core extension: CSS injection + Quick Settings toggle
├── prefs.js              # Preferences window (Libadwaita)
├── metadata.json         # Extension metadata
├── schemas/
│   └── *.gschema.xml     # GSettings schema (enabled, stripe-color, opacity)
├── locale/
│   ├── nautilus-zebra.pot # Translation template
│   └── {lang}/LC_MESSAGES/nautilus-zebra.po
└── LICENSE               # GPL-3.0
```

## Requirements

- GNOME Shell 45, 46, 47, 48, or 49
- Nautilus (GNOME Files)

## License

[GPL-3.0](LICENSE)
