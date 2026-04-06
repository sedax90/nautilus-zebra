<p align="center">
  <img src="icon.svg" width="128" height="128" alt="Nautilus Zebra icon" />
</p>

<h1 align="center">Nautilus Zebra</h1>

<p align="center">
  A GNOME Shell extension that adds <strong>zebra striping</strong> to the Nautilus file manager list view.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/GNOME_Shell-45--49-blue?logo=gnome&logoColor=white" alt="GNOME Shell" />
  <img src="https://img.shields.io/badge/license-GPL--3.0-green" alt="License" />
</p>

---

## Features

- Alternating row colors in Nautilus list view
- **Even or odd rows** — choose which rows get striped
- **Quick Settings toggle** in the system panel
- **Color picker** — any color you want
- **Opacity slider** — from 1% to 30%
- **Live preview** in the preferences window
- Preserves native **hover**, **selection**, and **drag** states
- Only affects Nautilus — other GTK4 apps are untouched
- Translations: English, Italian, French, German, Spanish, Chinese

## How It Works

The extension injects a CSS rule into `~/.config/gtk-4.0/gtk.css` targeting Nautilus list view rows:

```css
.nautilus-list-view columnview > listview > row:nth-child(even) {
    background-color: rgba(128, 128, 128, 0.05);
}
```

The CSS block is wrapped in start/end markers so it can be cleanly added and removed without touching your existing styles. Nautilus is automatically restarted when settings change.

## Installation

### From extensions.gnome.org

> Coming soon

### From source

```bash
git clone https://github.com/sedax90/nautilus-zebra.git
cd nautilus-zebra
make install
```

Then log out and log back in (required on Wayland), and enable the extension:

```bash
gnome-extensions enable nautilus-zebra@cristian
```

### Build ZIP (for manual distribution)

```bash
./build.sh
```

### Uninstall

```bash
gnome-extensions disable nautilus-zebra@cristian
make uninstall
```

## Usage

1. Open **Quick Settings** (click the system area in the top bar)
2. Toggle **Nautilus Zebra** on/off
3. To customize, open the extension preferences:
   ```bash
   gnome-extensions prefs nautilus-zebra@cristian
   ```

### CLI configuration

```bash
# Enable/disable
gsettings set org.gnome.shell.extensions.nautilus-zebra enabled true

# Change color (RGBA format)
gsettings set org.gnome.shell.extensions.nautilus-zebra stripe-color 'rgba(0,100,200,0.05)'

# Change opacity (1-30)
gsettings set org.gnome.shell.extensions.nautilus-zebra opacity 8

# Stripe even or odd rows
gsettings set org.gnome.shell.extensions.nautilus-zebra start-on-even false
```

## Requirements

- GNOME Shell 45, 46, 47, 48, or 49
- Nautilus (GNOME Files)

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/sedax90/nautilus-zebra).

## License

[GPL-3.0](LICENSE)
