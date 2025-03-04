'use strict';

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  bytesToDigits,
  bytesToFixedSize,
  bytesToShortSize,
  digitsToBytes,
  getCreditCardMaskN16,
} from '../src/Digits.js';

describe('Bytes & Digits', () => {
  var dataset = [
    ['000', '6400', 'zeros'],
    ['011', '6501', 'ones'],
    ['022', '6602', 'deuces'],
    ['033', '6703', 'triplets'],
    ['044', '6804', 'fours'],
    ['055', '6905', 'fives'],
    ['066', '6a06', 'sixes'],
    ['077', '6b07', 'sevens'],
    ['088', '6c08', 'eights'],
    ['099', '6d09', 'nines'],
    [
      '00010203040506070809',
      '6465666768696a6b6c6d',
      ''
    ]
  ];

  describe('digitsToBytes()', () => {
    dataset.map(([value, expected, groupName]) => {
      it(`"${value}" -> "${expected}" ${groupName}`, () => {
        var data = digitsToBytes(value);
        expect(data.toString('hex')).equal(expected)
      });
    });
  });

  describe('bytesToDigits()', () => {
    var checkReversed = dataset.map(a => [a[1], a[0], a[2]]);

    checkReversed.map(([value, expected, groupName]) => {
      it(`"${value}" -> "${expected}" ${groupName}`, () => {
        expect(Digits.bytesToDigits(Buffer.from(value, 'hex'))).equal(expected);
      });
    });
  });
});

describe('Bytes & Size', () => {
  var KILO_BYTE = 1024;
  var MEGA_BYTE = Math.pow(KILO_BYTE, 2);
  var GIGA_BYTE = Math.pow(KILO_BYTE, 3);
  var TERA_BYTE = Math.pow(KILO_BYTE, 4);
  var PETA_BYTE = Math.pow(KILO_BYTE, 5);
  var EXA_BYTE = Math.pow(KILO_BYTE, 6);
  var ZETTA_BYTE = Math.pow(KILO_BYTE, 7);
  var YOTTA_BYTE = Math.pow(KILO_BYTE, 8);
  var BRONTO_BYTE = Math.pow(KILO_BYTE, 9);

  describe('bytesToShortSize()', () => {
    var checkBytesToShortSize = [
      ['98b', 'byte', 98],
      ['1Kb', 'kilo', KILO_BYTE],
      ['1Mb', 'mega', MEGA_BYTE],
      ['1Gb', 'giga', GIGA_BYTE],
      ['1Tb', 'tera', TERA_BYTE],
      ['1Pb', 'peta', PETA_BYTE],
      ['1Eb', 'exa', EXA_BYTE],
      ['1Zb', 'zetta', ZETTA_BYTE],
      ['1Yb', 'yotta', YOTTA_BYTE],
      ['1Bb', 'bronto', BRONTO_BYTE],
    ];

    checkBytesToShortSize.map(([expected, name, value]) => {
      it(`1 ${name} = "${expected}"`, () => {
        expect(Digits.bytesToShortSize(value)).equal(expected);
      });
    });
  });

  describe('bytesToFixedSize()', () => {
    var checkBytesToFixedSize = [
      ['98.0b', 'byte', 98],
      ['1.0Kb', 'kilo', KILO_BYTE],
      ['1.0Mb', 'mega', MEGA_BYTE],
      ['1.0Gb', 'giga', GIGA_BYTE],
      ['1.0Tb', 'tera', TERA_BYTE],
      ['1.0Pb', 'peta', PETA_BYTE],
      ['1.0Eb', 'exa', EXA_BYTE],
      ['1.0Zb', 'zetta', ZETTA_BYTE],
      ['1.0Yb', 'yotta', YOTTA_BYTE],
      ['1.0Bb', 'bronto', BRONTO_BYTE],
    ];

    checkBytesToFixedSize.map(([expected, name, value]) => {
      it(`1 ${name} = "${expected}"`, () => {
        expect(Digits.bytesToFixedSize(value)).equal(expected);
      });
    });
  });
});

describe('Credit Card', () => {
  describe('getCreditCardMaskN16()', () => {
    var value = '1234567890123456';
    var expected = '1234 5678 9012 3456';

    it(`"${value}" -> "${expected}"`, () => {
      var data = getCreditCardMaskN16(value);
      expect(data).equal(expected);
    });
  });
});
