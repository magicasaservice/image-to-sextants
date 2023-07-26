<!-- SPDX-FileCopyrightText: 2021 Tech and Software Ltd. -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->

Install dependencies:

`npm install sharp`

# Example 1

`node example1.js`

This converts a small test image into teletext block mosaic characters. Note: The resulting characters need to be displayed on a teletext screen for correct viewing.

# Example 2

`node example2.js ../../test/zebra.jpg`

This converts a larger image into teletext block mosaic characters, having adjusted the size so the aspect ratio will be correct and to fit the available pixels on a teletext screen.

# Example 3

`node example3.js ../../test/cat.jpg`

Similar to example 2, with additional dithering.

# imagetounicode.js

1. Download `unscii-8.otf` from http://viznut.fi/unscii/ and put it into a `fonts` subdirectory

2. Run one of these 

```
node imagetounicode.js ../../test/zebra.png > page.html
node imagetounicode.js ../../test/cat.jpg > page.html
```

3. Open page.html in your browser. It should display the image converted to unicode sextant characters.
