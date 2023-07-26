// SPDX-FileCopyrightText: 2021 Tech and Software Ltd.
// SPDX-License-Identifier: GPL-2.0-or-later
import sextantsToUnicode from './data/SextantsToUnicode.js'; 

export class ImageToSextants {
    // buffer is 1-channel raw image
    constructor(buffer, width) {
        this._buffer = buffer;
        this._widthPx = width;
        this._heightPx = buffer.length / width;

        if (!Number.isInteger(width))
            throw new Error('E9 ImageToSextants: width should be integer');
        if (!Number.isInteger(this._heightPx))
            throw new Error(`E11 ImageToSextants: bad width ${width} for buffer length ${buffer.length}`);

        this._numRows = Math.ceil(this._heightPx / 3);
        this._numCols = Math.ceil(this._widthPx / 2);
    }

    getSextants(col, row) {
        const xIdx = col * 2,
              yIdx = row * this._widthPx * 3,
              rootIndex = yIdx + xIdx;

        if (row >= this._numRows)
            throw new Error(`E25 ImageToSextants: row ${row} out of range for number of rows ${this._numRows}`);
        if (col >= this._numCols)
            throw new Error(`E27 ImageToSextants: col ${col} out of range for number of cols ${this._numCols}`);

        const result = [
            this._buffer[rootIndex],
            this._buffer[rootIndex + 1],
            this._buffer[rootIndex + this._widthPx],
            this._buffer[rootIndex + this._widthPx + 1],
            this._buffer[rootIndex + this._widthPx * 2],
            this._buffer[rootIndex + this._widthPx * 2 + 1]
        ];
        return result.map(p => p ?? 0);
    }

    getValueFromSextants(col, row) {
        const cells = this.getSextants(col, row);
        const isPixelOn = v => v > 127 ? 1 : 0;

        const val = isPixelOn(cells[0]) +
                    (isPixelOn(cells[1]) << 1) +
                    (isPixelOn(cells[2]) << 2) +
                    (isPixelOn(cells[3]) << 3) +
                    (isPixelOn(cells[4]) << 4) +
                    (isPixelOn(cells[5]) << 5);
        return val;
    }

    // response range is 0x20 to 0x3f and 0x60 to 0x7f
    getTeletextG1Char(col, row) {
        const value = this.getValueFromSextants(col, row);
        let result;
        if (value < 0x20)
            result = String.fromCharCode(value + 0x20)
        else
            result = String.fromCharCode(value + 0x40)

        return result;
    }

    getUnicodeChar(col, row) {
        const value = this.getValueFromSextants(col, row);
        // using a lookup as the mapping isn't a contiguous block
        return sextantsToUnicode[value];
    }

    getTeletextG1Rows(options) {
        let rows = [];
        for (let r = 0; r < this._numRows; r++) {
            const cols = [];
            for (let c = 0; c < this._numCols; c++) {
                cols.push(this.getTeletextG1Char(c, r));
            }
            rows.push(cols.join(''));
        }

        rows = _addColourAttributesToRows(rows, options);
        return rows;
    }

    get unicodeRows() {
        const rows = [];
        for (let r = 0; r < this._numRows; r++) {
            const cols = [];
            for (let c = 0; c < this._numCols; c++) {
                cols.push(this.getUnicodeChar(c, r));
            }
            rows.push(cols.join(''));
        }
        return rows;
    }

    get html() {
        let response = HTML_WRAP_HEAD;
        response += this.unicodeRows.join('\n');
        response += HTML_WRAP_FOOT;
        return response;
    }
}


function _addColourAttributesToRows(rows, options = {}) {
    let bg = options.background ?? null;
    let fg = options.foreground ?? null;
    if (bg && !(bg in ATTRIBUTES)) throw new Error(`E109 bad background: ${bg}`);
    if (fg && !(fg in ATTRIBUTES)) throw new Error(`E110 bad foreground: ${fg}`);

    if (bg == 'black') bg = null; // not using attributes for black bg as it's the page default
    if (bg && !fg) fg = 'white';

    if (fg || bg) {
        rows = rows.map(row => {
            let attributes = '';
            if (bg) attributes = ATTRIBUTES[bg] + ATTRIBUTES.newBackground;
            if (fg) attributes += ATTRIBUTES[fg];
            return attributes + row;
        });
    }
    return rows;
}

const ATTRIBUTES = {
    black:   "\x10",
    red:     "\x11",
    green:   "\x12",
    yellow:  "\x13",
    blue:    "\x14",
    magenta: "\x15",
    cyan:    "\x16",
    white:   "\x17",
    "newBackground": "\x1d"
};

const HTML_WRAP_HEAD = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
body {
    background-color: black;
    color: white;
}
@font-face {
    font-family: 'Unscii';
    src: url('fonts/unscii-8.otf') format('opentype');
    -webkit-font-smoothing: none;
    font-smooth: never;
}
pre {
    font-size: 16px;
    font-family: Unscii;
    line-height: 16px;
}
</style></head><body><pre>`;

const HTML_WRAP_FOOT = `</pre></body></html>`;
