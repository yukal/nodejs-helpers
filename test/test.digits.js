const digits = require('../digits');

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
// getCreditCardMaskN16

describe('credit card mask N16', () => {
    test(`"${valCCARDN16}" -> "${resCCARDN16}"`, () => {
        const data = digits.getCreditCardMaskN16(valCCARDN16);
        expect(data).toBe(resCCARDN16);
    });
});
