# Krohnkite-i3

A dynamic tiling script for KWin 6 and KDE Plasma 6.

Krohnkite-i3 is an independent fork of [Kröhnkite](https://codeberg.org/anametologin/Krohnkite), focused on i3-style tiling for the KDE Plasma desktop. It retains the original project's MIT license and notices; see [LICENSE](LICENSE).

This fork currently uses the KWin package ID `krohnkite`, so installing it updates/replaces an installation of the original Kröhnkite script. The fork and original cannot be installed side by side under that ID.

![screenshot](./img/output.gif)

The goal is to provide i3-style tiling inside KDE Plasma without replacing KWin with i3, preserving Plasma and KWin window-management features.

The original Kröhnkite project supports layouts inspired by other tiling window managers. This fork narrows its scope to make i3-style behavior easier to develop and maintain.

For the original project's layouts and development, visit [anametologin/Kröhnkite](https://codeberg.org/anametologin/Krohnkite). This fork is maintained separately; changes here are not automatically part of the original project.

## Features

- [x] i3 style splitting (vertical and horizontal)
- [ ] Window Shifting/Movement
- [ ] Nested container tree
- [ ] alternative layouts
  - [ ] stack
  - [ ] tabbed

## Development requirements

- Node.js and npm
- TypeScript (installed through `package.json`)
- [go-task](https://github.com/go-task/task)
- p7zip (the `7z` command)
- KDE Plasma 6 / KWin 6 for installing and testing the script

## Troubleshooting

1. Reboot after changing the Krohnkite configuration. Do not repeatedly toggle the script off and on, as this may start multiple instances.
2. To remove unused KWin shortcuts, invoke the D-Bus cleanup method. Service name: `org.kde.kglobalaccel`; path: `/component/kwin`; method: `org.kde.kglobalaccel.Component.cleanUp`. Arch Linux example:

```
qdbus6 org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.cleanUp
```

3. If you see unexpected gaps or gray/white rectangles, a 1x1 window may need to be filtered by title or another window property. If present, add these programs to the filter:

```
xwaylandvideobridge,plasmashell,ksplashqml
```

## Installation

You can install Kröhnkite in multiple ways.

### Using .kwinscript package file

You can download `krohnkite-x.x.x.x.kwinscript` file, and install it through
_System Settings_.

1. Download the kwinscript file
2. Open `System Settings` > `Window Management` > `KWin Scripts`
3. Press `Import KWin script...` on the top-right corner
4. Select the downloaded file

Alternatively, through command-line:
get info about package:

```
kpackagetool6 -t KWin/Script -s krohnkite
```

install:

```
kpackagetool6 -t KWin/Script -i krohnkite-x.x.x.x.kwinscript
```

upgrade:

```
kpackagetool6 -t KWin/Script -u krohnkite-x.x.x.x.kwinscript
```

uninstall:

```
kpackagetool6 -t KWin/Script -r krohnkite
```

### Installing from Git repository

Install [go-task](https://taskfile.dev/installation/), [Node.js/npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), and [7-Zip](https://www.7-zip.org/download.html). The build creates `.kwinscript` packages in `builds/`.

Build and install the script into the current KDE user:

```
go-task install
```

To build a package without installing it:

```
go-task package
```

To remove the installed script:

```
go-task uninstall
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for fork maintenance, syncing with the original project, and submitting changes.

## Settings

### Add a class name, a resource name or a window caption to ignore or float

1. to found window's className,resourcename or caption see [readme](https://github.com/anametologin/krohnkite#search-a-window-parameters-to-filter-float-etc)
2. you can use the name of class in square brackets: `[myNamE]` will float or ignore all windows with class or resource names such: 'myname1', 'Myname2', 'Notmyname555' etc...

## Default Key Bindings

| Key              | Action             |
| ---------------- | ------------------ |
| Meta + C         | Split Horizontally |
| Meta + V         | Split Vertically   |
|                  |                    |
| Meta + .         | Focus Next         |
| Meta + ,         | Focus Previous     |
|                  |                    |
| Meta + J         | Focus Down         |
| Meta + K         | Focus Up           |
| Meta + H         | Focus Left         |
| Meta + L         | Focus Right        |
|                  |                    |
| Meta + Shift + J | Move Down/Next     |
| Meta + Shift + K | Move Up/Previous   |
| Meta + Shift + H | Move Left          |
| Meta + Shift + L | Move Right         |
|                  |                    |
| Meta + I         | Increase           |
| Meta + D         | Decrease           |
| Meta + F         | Toggle Floating    |
| Meta + \         | Next Layout        |
| Meta + \|        | Previous Layout    |
|                  |                    |
| Meta + Return    | Set as Master      |
|                  |                    |

## Tips

### Setting Up for Multi-Screen

Krohnkite supports multi-screen setup, but KWin has to be configured to unlock
the full potential of the script.

1. Enable `Separate Screen Focus` feature:

- `System Settings` > `Window Management` > `Window Behavior` > `Multiscreen Behaviour`

  `OR` use console commands:

```
   kwriteconfig6 --file ~/.config/kwinrc --group Windows --key ActiveMouseScreen false
   kwriteconfig6 --file ~/.config/kwinrc --group Windows --key SeparateScreenFocus true
```

2. Bind keys for global shortcut `Switch to Next/Previous Screen`
   (Recommend: `Meta + ,` / `Meta + .`)
3. Bind keys for global shortcut `Window to Next/Previous Screen`
   (Recommend: `Meta + <` / `Meta + >`)

### Removing Title Bars

Breeze window decoration can be configured to completely remove title bars from
all windows:

1. `System Setting` > `Application Style` > `Window Decorations`
2. Click `Configure Breeze` inside the decoration preview.
3. `Window-Specific Overrides` tab > `Add` button
4. Enter the followings, and press `Ok`:
   - `Regular expression to match`: `.*`
   - Tick `Hide window title bar`

### Changing Border Colors

Changing the border color makes it easier to identify current window. This is
convinient if title bars are removed.

1. You can use the Oxygen decoration theme. [Oxygen theme settings][]
2. You can install third-party decorations, see [Border color conversation][]
3. You can add to the WM section in $HOME/.config/kdeglobals (this changes the default Breeze decoration frame colors):
   - `frame=R,G,B`
   - `inactiveFrame=R,G,B`

[Oxygen theme settings]: https://github.com/anametologin/krohnkite/assets/165245883/51b4cb48-33c7-4627-a119-33d1abbe2b99
[Border color conversation]: https://github.com/anametologin/krohnkite/issues/15

### Setting Minimum Geometry Size

Some applications like discord and KDE settings dont tile nicely as they have a minimum size requirement.
This causes the applications to overlap with other applications. To mitigate this we can set minimum size for all windows to be 0.

1. `System Setting` > `Window Management` > `Window Rules`
2. Click on `+ Add New...`
3. Set `Window class` to be `Unimportant`
4. Set `Window types` to `Normal Window`
5. Click `+ Add Properties...`
6. Add the `Minimum Size` Property
7. Set the fields to `Force` and `0` x `0`
8. Apply

### Prevent borders and shadows from disappearing

When a window is marked "maximized" in Breeze theme, its borders are removed to save screen space.
This behavior may not be preferable depending on your setup. This can be mitigated by disabling maximized windows using Window Rules.

1. `System Setting` > `Window Management` > `Window Rules`
2. Click on `+ Add New...`
3. Set `Window class` to be `Unimportant`
4. Set `Window types` to `Normal Window`
5. Click `+ Add Properties...`
6. Add the `Maximized horizontally` and `Maximized vertically` Properties.
7. Set the options to `Force` and `No`.
8. Apply

## Useful Development Resources

- [KWin Scripting Tutorial](https://develop.kde.org/docs/plasma/kwin/)
- [KWin Scripting API](https://develop.kde.org/docs/plasma/kwin/api/)
- Adding configuration dialog
  - [Development/Tutorials/Plasma/JavaScript/ConfigDialog](https://techbase.kde.org/Development/Tutorials/Plasma/JavaScript/ConfigDialog)
  - [Development/Tutorials/Using KConfig XT](https://techbase.kde.org/Development/Tutorials/Using_KConfig_XT)
- `*.ui` files can be edited with [Qt Designer](http://doc.qt.io/qt-5/qtdesigner-manual.html).
  It's very straight-forward if you're used to UI programming.
