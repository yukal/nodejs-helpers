const digits = require('../lib/digits');

const KILO_BYTE = 1024;
const MEGA_BYTE = Math.pow(KILO_BYTE, 2);
const GIGA_BYTE = Math.pow(KILO_BYTE, 3);
const TERA_BYTE = Math.pow(KILO_BYTE, 4);
const PETA_BYTE = Math.pow(KILO_BYTE, 5);
const EXA_BYTE = Math.pow(KILO_BYTE, 6);
const ZETTA_BYTE = Math.pow(KILO_BYTE, 7);
const YOTTA_BYTE = Math.pow(KILO_BYTE, 8);
const BRONTO_BYTE = Math.pow(KILO_BYTE, 9);

const valCCARDN16 = '1234567890123456';
const resCCARDN16 = '1234 5678 9012 3456';
const checkDigits = [
    ['000','6400','zeros'],
    ['011','6501','ones'],
    ['022','6602','deuces'],
    ['033','6703','triplets'],
    ['044','6804','fours'],
    ['055','6905','fives'],
    ['066','6a06','sixes'],
    ['077','6b07','sevens'],
    ['088','6c08','eights'],
    ['099','6d09','nines'],
    [
        '00010203040506070809',
        '6465666768696a6b6c6d',
        ''
    ]
];

const checkBytesToShortSize = [
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

const checkBytesToFixedSize = [
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

// ..............................
// digitsToBytes

describe('digits to bytes', () => {
    test.each(checkDigits)('"%s" -> "%s" %s', (input, expected) => {
        const data = digits.digitsToBytes(input);
        expect(data.toString('hex')).toBe(expected);
    });
});

// ..............................
// bytesToDigits

describe('bytes to digits', () => {
    const checkReversed = checkDigits.map(a => [ a[1], a[0], a[2] ]);

    test.each(checkReversed)('"%s" -> "%s" %s', (input, expected) => {
        const data = digits.bytesToDigits(Buffer.from(input, 'hex'));
        expect(data.toString('hex')).toBe(expected);
    });
});

// ..............................
// bytesToShortSize

describe('bytes to short size', () => {
    test.each(checkBytesToShortSize)('%s [%s] = %d', (expected, name, input) => {
        expect(digits.bytesToShortSize(input)).toBe(expected);
    });
});

// ..............................
// bytesToFixedSize

describe('bytes to fixed size', () => {
    test.each(checkBytesToFixedSize)('%s [%s] = %d', (expected, name, input) => {
        expect(digits.bytesToFixedSize(input)).toBe(expected);
    });
});

// ..............................
// getCreditCardMaskN16

describe('credit card mask N16', () => {
    test(`"${valCCARDN16}" -> "${resCCARDN16}"`, () => {
        const data = digits.getCreditCardMaskN16(valCCARDN16);
        expect(data).toBe(resCCARDN16);
    });
});
