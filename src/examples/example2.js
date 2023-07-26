// SPDX-FileCopyrightText: 2021 Tech and Software Ltd.
// SPDX-License-Identifier: GPL-2.0-or-later

import sharp from 'sharp';
import { ImageToSextants } from '../ImageToSextants.js';

async function go(filename) {
    try {
        const meta = await sharp(filename).metadata();

        // squash horizontally so displayed aspect ratio is correct
        const resized = await sharp(filename)
            .resize(Math.round(meta.width * (8/9)), meta.height, {
                fit: 'fill'
            }).toBuffer();

        // Resize to available pixels and convert to 1 channel raw image.
        // We will use 1 spacing attribute to set cyan graphics,
        // resulting in 39*2 horizontal pixels
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
        console.log(data);

    } catch (e) {
        console.error(e);
        process.exitCode = 42;
    }
}

if (!process.argv[2]) {
    console.error("Missing filename.\nUsage: node example2.js filename");
    process.exitCode = 1;
} else {
    go(process.argv[2]);
}
