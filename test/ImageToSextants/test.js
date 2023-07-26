// SPDX-FileCopyrightText: 2021 Tech and Software Ltd.
// SPDX-License-Identifier: GPL-2.0-or-later

import test from 'ava';

import { ImageToSextants } from '../../src/ImageToSextants.js';

test('get sextant from 2 x 3 image', t => {
    const buffer = Buffer.from("\x00\x01\x02\x03\x04\x05");
    const subject = new ImageToSextants(buffer, 2);

    const result = subject.getSextants(0, 0);
    t.deepEqual(result, [0x0, 0x1, 0x2, 0x3, 0x4, 0x5]);
});

test('get sextant from 4 x 6 image', t => {
    const buffer = Buffer.from("\x00\x01\x02\x03" +
                               "\x04\x05\x06\x07" +
                               "\x08\x09\x10\x11" +
                               "\x12\x13\x14\x15" +
                               "\x16\x17\x18\x19" +
                               "\x20\x21\x22\x23");

    const subject = new ImageToSextants(buffer, 4);

    const result = subject.getSextants(1, 1);
    t.deepEqual(result, [0x14, 0x15, 0x18, 0x19, 0x22, 0x23]);
});

test('get sextant from 1 x 1 image', t => {
    const buffer = Buffer.from("\x11");
    const subject = new ImageToSextants(buffer, 1);

    const result = subject.getSextants(0, 0);
    t.deepEqual(result, [0x11, 0, 0, 0, 0, 0]);
});

test('sextant out of range', t => {
    let buffer = Buffer.from("\x11");
    let subject = new ImageToSextants(buffer, 1);

    t.throws(() => {
        subject.getSextants(1, 1);
    });

    buffer = Buffer.from("\x00\x01\x02\x03");
    subject = new ImageToSextants(buffer, 1);

    t.throws(() => {
        subject.getSextants(2, 0);
    });
});

test('bad width', t => {
    const buffer = Buffer.from("\x00\x01\x02");

    t.throws(() => {
        new ImageToSextants(buffer, 2);
    }, undefined, 'exception not thrown by constructor with bad width');
});

test('sextant converted to value', t => {
    let buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    let subject = new ImageToSextants(buffer, 2);
    let value = subject.getValueFromSextants(0, 0);
    t.is(value, 0b000000);

    buffer = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    subject = new ImageToSextants(buffer, 2);
    value = subject.getValueFromSextants(0, 0);
    t.is(value, 0b111111);

    buffer = Buffer.from([0x00, 0xff, 0xff, 0x00, 0x00, 0xff]);
    subject = new ImageToSextants(buffer, 2);
    value = subject.getValueFromSextants(0, 0);
    t.is(value, 0b100110);
});


test('get teletext block mosaic', t => {
    // ..
    // .. is character 0x20 (space in ascii)
    // .. 
    let buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    let subject = new ImageToSextants(buffer, 2);

    let result = subject.getTeletextG1Char(0, 0);
    t.is(result, ' ');

    // XX
    // XX is character 0x3f (? in ascii)
    // X.
    buffer = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0x00]);
    subject = new ImageToSextants(buffer, 2);

    result = subject.getTeletextG1Char(0, 0);
    t.is(result, '\x3f');

    // ..
    // .. is character 0x60 (` in ascii)
    // .X
    buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0xff]);
    subject = new ImageToSextants(buffer, 2);

    result = subject.getTeletextG1Char(0, 0);
    t.is(result, '\x60');

    // XX
    // XX is character 0x7f (delete control code in ascii)
    // XX
    buffer = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    subject = new ImageToSextants(buffer, 2);

    result = subject.getTeletextG1Char(0, 0);
    t.is(result, '\x7f');
});

test('teletext rows', t => {
    let buffer = Buffer.from([0x00, 0xFF, // .X
                              0xFF, 0x00, // X.
                              0x00, 0xFF, // .X
                              0xFF, 0x00, // X.
                              0x00, 0xFF, // .X
                              0xFF, 0x00  // X.
                             ]);
    let subject = new ImageToSextants(buffer, 2);
    let rows = subject.getTeletextG1Rows();
    t.deepEqual(rows, ["\x66", "\x39"]);

    buffer = Buffer.from([0x00, 0xFF, 0xFF, 0x00, // .XX.
                          0x00, 0xFF, 0xFF, 0x00, // .XX.
                          0x00, 0xFF, 0xFF, 0x00, // .XX.
                          0xFF, 0xFF, 0x00, 0x00, // XX..
                          0x00, 0x00, 0xFF, 0xFF, // ..XX
                          0xFF, 0xFF, 0x00, 0x00  // XX..
                         ]);
    subject = new ImageToSextants(buffer, 4);
    rows = subject.getTeletextG1Rows();
    t.deepEqual(rows, [
        "\x6a\x35",
        "\x73\x2c"
    ]);
});

test('teletext rows with options object', t => {
    const buffer = Buffer.from("\x00");
    const subject = new ImageToSextants(buffer, 1);
    let rows = subject.getTeletextG1Rows({});
    t.deepEqual(rows, [" "])

    rows = subject.getTeletextG1Rows({
        foreground: 'yellow'
    });
    t.deepEqual(rows, ["\x13 "]);

    rows = subject.getTeletextG1Rows({
        background: 'yellow'
    });
    t.deepEqual(rows, ["\x13\x1d\x17 "]);

    rows = subject.getTeletextG1Rows({
        background: 'yellow',
        foreground: 'blue'
    });
    t.deepEqual(rows, ["\x13\x1d\x14 "]);
});

test('get unicode sextant characters', t => {
    // ..
    // .. is character 0x20 (space in unicode)
    // .. 
    let buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    let subject = new ImageToSextants(buffer, 2);

    let result = subject.getUnicodeChar(0, 0);
    t.is(result, ' ');

    // XX
    // XX is character U+1fb1d BLOCK SEXTANT-12345
    // X.
    buffer = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0x00]);
    subject = new ImageToSextants(buffer, 2);

    result = subject.getUnicodeChar(0, 0);
    t.is(result, String.fromCodePoint(0x1fb1d));

    // // XX
    // // XX is character U+2588 FULL BLOCK
    // // XX
    buffer = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    subject = new ImageToSextants(buffer, 2);

    result = subject.getUnicodeChar(0, 0);
    t.is(result, String.fromCodePoint(0x2588));
});
