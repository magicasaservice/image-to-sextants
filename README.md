<!-- SPDX-FileCopyrightText: 2021 Tech and Software Ltd. -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->

Convert an image to teletext block mosaic characters (G1 character set) or the equivalent sextant characters in the Unicode [Symbols for Legacy Computing](https://en.wikipedia.org/wiki/Symbols_for_Legacy_Computing) block.

Here's an example rendered using the unscii-8 font:

![Zebra image converted to Unicode sextant characters](https://bitbucket.org/rahardy/image-to-sextants/raw/main/doc/rendered_example.png)

# Importing

```javascript
import { ImageToSextants } from '@techandsoftware/image-to-sextants';
```

# API

## ImageToSextants() constructor

```javascript
const sextants = new ImageToSextants(image, width);
```

* `image` is a Buffer, a one channel raw image of 8-bit unsigned ints. See the example below on creating this.
* `width` is the image width

## sextants.getTeletextG1Rows([options])

* `options` Object
  * `foreground` string
    * Default:  `'white'` if background is supplied, otherwise unset
    * Values: `'black'` | `'red'` | `'green'` | `'yellow'` | `'blue'` | `'magenta'` | `'cyan'` | `'white'`
  * `background` string
    * Default: unset
    * Values: `'black'` | `'red'` | `'green'` | `'yellow'` | `'blue'` | `'magenta'` | `'cyan'` | `'white'`
* Returns: Array of strings containing mosaic bytes in the teletext G1 character set.

If you supply `options` then the spacing attributes to activate graphics mode and set the colours are added at the beginning of each row. Without `options`, then they aren't, and it's up to you to put these on the containing page. For example, you can set the foreground colour and not the background, then the display will use the existing background colour. However, if you supply a background colour and not foreground colour, then the foreground defaults to white to avoid invisible graphics.

Also, the image is not resized to fit a teletext page. You will need to resize the image before you call the constructor. There's an example below with resizing.

Example:

```javascript
// Gets white on blue mosaic characters
const rows = sextants.getTeletextG1Rows({
    foreground: 'white',
    background: 'blue'
});
```

## sextants.unicodeRows property

* Returns: Array of strings containing Unicode characters.

Characters use the [block sextant](https://www.unicode.org/charts/PDF/U1FB00.pdf) characters defined by Unicode in the *Symbols for Legacy Computing* block, plus a few others outside of the block. The actual range is U+1FB00 to U+1FB3B, U+20, U+258C, U+2590 and U+2588.

To display, you'll need a suitable font.  You could try [Unscii](http://viznut.fi/unscii/) which has the correct coverage. This is also available in [@techandsoftware/teletext-fonts](https://www.npmjs.com/package/@techandsoftware/teletext-fonts).


## sextants.html property

* Returns: HTML containing the Unicode sextants.

This is for convenience, for easy viewing in a web page with the correct font styling. Download and put `unscii-8.otf` in the `fonts` subdirectory relative to where you save the HTML for the characters to display correctly.

## Other API calls

You can just use the properties above, however you can get individual characters if you need them:

* sextants.getTeletextG1Char(col, row)
  * `col` and `row` refer to a 2x3 cell of pixels on the input image
  * Returns: The G1 byte at the `col` and `row`
* sextants.getUnicodeChar(col, row)
  * `col` and `row` refer to a 2x3 cell of pixels on the input image
  * Returns: The unicode char at the `row` and `col`

# Examples

The examples are in `src/examples` in the repo.

## Example 1

Here, I'm using [sharp](https://www.npmjs.com/package/sharp) to read the source image and convert to the required Buffer input.  This converts without resizing the image.

```javascript
import sharp from 'sharp';
import { ImageToSextants } from '@techandsoftware/image-to-sextants';

async function convert(filename) {
    // convert the input image to single channel raw buffer
    const raw = await sharp(filename)
        .toColourspace('b-w')
        .normalise()
        .raw().toBuffer({ resolveWithObject: true });

    // convert the buffer to teletext mosaic bytes
    const sextants = new ImageToSextants(raw.data, raw.info.width);
    const teletextData = sextants.getTeletextG1Rows({
        foreground: 'white'
    });
}

convert('myimage.png');
```

## Example 2

The example above is a minimum example, but it hasn't resized the original image or adjusted it to fix the aspect ratio of the target display.

If the teletext display is a typical TV or emulator, it'll have an aspect ratio of 1.2, and the pixels of the mosaic characters will be oblong and not square.  To prepare for that, you need to squash the source image horizontally by multiplying by eight ninths (0.888).

The available pixels on the teletext display is 80 x 75, so you also need to resize the input image to fit that. From the 80 horizontal pixels, you need to deduct 2 pixels per spacing attribute used to set the colours and graphics. I'm using sharp again to do this.

```javascript
const meta = await sharp(filename).metadata();

// squash horizontally so displayed aspect ratio is correct
const resized = await sharp(filename)
    .resize(Math.round(meta.width * (8/9)), meta.height, {
        fit: 'fill'
    }).toBuffer();

// Resize to available pixels and convert to 1-channel raw image.
// With fit: 'cover', sharp scales proportionally and crops.
// We will use 1 spacing attribute to set cyan graphics and
// use the default page background, resulting in 39*2 pixels horizontally.
const raw = await sharp(resized)
    .toColourspace('b-w')
    .resize(39*2, 75, {
        fit: 'cover',
        position: 'entropy'
    })
    .normalise()
    .raw().toBuffer({ resolveWithObject: true });

const sextants = new ImageToSextants(raw.data, raw.info.width);
const data = sextants.getTeletextG1Rows({
    foreground: 'cyan',
});
```

## Other examples

* `example3.js` adds dithering to the image

* `imagetounicode.js` generates HTML containing the image converted to Unicode sextant characters
