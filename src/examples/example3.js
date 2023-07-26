// SPDX-FileCopyrightText: 2021 Tech and Software Ltd.
// SPDX-License-Identifier: GPL-2.0-or-later

import sharp from 'sharp';
import { ImageToSextants } from '../ImageToSextants.js';

async function go(filename) {
    try {
        const meta = await sharp(filename).metadata();
        const resized = await sharp(filename)
            .resize(Math.round(meta.width * (8/9)), meta.height, {
                fit: 'fill'
            }).toBuffer();

        const png = await sharp(resized)
            .resize(39*2, 75, {
                fit: 'cover',
                position: 'entropy'
            })
            .flatten({
                background: '#000000'
            })
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
    console.error("Missing filename.\nUsage: node example3.js filename");
    process.exitCode = 1;
} else {
    go(process.argv[2]);
}
