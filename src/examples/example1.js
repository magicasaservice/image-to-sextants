// SPDX-FileCopyrightText: 2021 Tech and Software Ltd.
// SPDX-License-Identifier: GPL-2.0-or-later

import sharp from 'sharp';
import { ImageToSextants } from '../ImageToSextants.js';

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

    console.log(teletextData);
}

convert('../../test/test.png');
