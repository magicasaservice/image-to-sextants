// SPDX-FileCopyrightText: 2021 Tech and Software Ltd.
// SPDX-License-Identifier: GPL-2.0-or-later

import sharp from 'sharp';
import { ImageToSextants } from '../ImageToSextants.js';

// This outputs HTML containing the image mapped to unicode sextants
async function go(filename) {
    try {
        const meta = await sharp(filename).metadata();

        // The first resize is so that the output aspect ratio is correct for unscii-8 (each character is 2 sextants wide and 3 height, squashed into 8x8 pixels)
        const resized = await sharp(filename)
        .resize(meta.width, Math.round(meta.height * 1.5), {
            fit: 'fill'
        }).toBuffer();

        const png = await sharp(resized)
            .resize(110, undefined, {
                fit: 'cover',
                position: 'entropy'
            })
            .normalise()
            .png({
                dither: 1.0,
                quality: 0
            })
            .toBuffer();

        const raw = await sharp(png)
            .toColourspace('b-w')
            .normalise()
            .raw().toBuffer({ resolveWithObject: true });

        const sextants = new ImageToSextants(raw.data, raw.info.width);
        console.log(sextants.html);
    } catch (e) {
        console.error(e);
        process.exitCode = 42;
    }
}

if (!process.argv[2]) {
    console.error("Missing filename.\nUsage: node imagetounicode.js filename");
    process.exitCode = 1;
} else {
    go(process.argv[2]);
}
