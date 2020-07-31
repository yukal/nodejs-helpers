const digits = require('../digits');

// 2020-07-31T10:02:26.533Z => (hex)14146b1f0a661a3503 => (base64)FBRrHwpmGjUD
const valDateISO = '2020-07-31T10:02:26.533Z';
const valDateISODigs = '20200731100226533';
const resDateISODigs = 'FBRrHwpmGjUD';
const valCCARDN16 = '1234567890123456';
const resCCARDN16 = '1234 5678 9012 3456';

// ..............................
// digitsToBytes

test('digitsToBytes ("000") -> "6400"', () => {
    const data = digits.digitsToBytes('000');
    expect(data.toString('hex')).toBe('6400');
});

test('digitsToBytes ("011") -> "6501"', () => {
    const data = digits.digitsToBytes('011');
    expect(data.toString('hex')).toBe('6501');
});

test('digitsToBytes ("022") -> "6602"', () => {
    const data = digits.digitsToBytes('022');
    expect(data.toString('hex')).toBe('6602');
});

test('digitsToBytes ("033") -> "6703"', () => {
    const data = digits.digitsToBytes('033');
    expect(data.toString('hex')).toBe('6703');
});

test('digitsToBytes ("044") -> "6804"', () => {
    const data = digits.digitsToBytes('044');
    expect(data.toString('hex')).toBe('6804');
});

test('digitsToBytes ("055") -> "6905"', () => {
    const data = digits.digitsToBytes('055');
    expect(data.toString('hex')).toBe('6905');
});

test('digitsToBytes ("066") -> "6a06"', () => {
    const data = digits.digitsToBytes('066');
    expect(data.toString('hex')).toBe('6a06');
});

test('digitsToBytes ("077") -> "6b07"', () => {
    const data = digits.digitsToBytes('077');
    expect(data.toString('hex')).toBe('6b07');
});

test('digitsToBytes ("088") -> "6c08"', () => {
    const data = digits.digitsToBytes('088');
    expect(data.toString('hex')).toBe('6c08');
});

test('digitsToBytes ("099") -> "6d09"', () => {
    const data = digits.digitsToBytes('099');
    expect(data.toString('hex')).toBe('6d09');
});

// ..............................
// bytesToDigits

test('bytesToDigits ("6400") -> "000"', () => {
    const data = digits.bytesToDigits(Buffer.from('6400', 'hex'));
    expect(data).toBe('000');
});

test('bytesToDigits ("6501") -> "011"', () => {
    const data = digits.bytesToDigits(Buffer.from('6501', 'hex'));
    expect(data).toBe('011');
});

test('bytesToDigits ("6602") -> "022"', () => {
    const data = digits.bytesToDigits(Buffer.from('6602', 'hex'));
    expect(data).toBe('022');
});

test('bytesToDigits ("6703") -> "033"', () => {
    const data = digits.bytesToDigits(Buffer.from('6703', 'hex'));
    expect(data).toBe('033');
});

test('bytesToDigits ("6804") -> "044"', () => {
    const data = digits.bytesToDigits(Buffer.from('6804', 'hex'));
    expect(data).toBe('044');
});

test('bytesToDigits ("6905") -> "055"', () => {
    const data = digits.bytesToDigits(Buffer.from('6905', 'hex'));
    expect(data).toBe('055');
});

test('bytesToDigits ("6a06") -> "066"', () => {
    const data = digits.bytesToDigits(Buffer.from('6a06', 'hex'));
    expect(data).toBe('066');
});

test('bytesToDigits ("6b07") -> "077"', () => {
    const data = digits.bytesToDigits(Buffer.from('6b07', 'hex'));
    expect(data).toBe('077');
});

test('bytesToDigits ("6c08") -> "088"', () => {
    const data = digits.bytesToDigits(Buffer.from('6c08', 'hex'));
    expect(data).toBe('088');
});

test('bytesToDigits ("6d09") -> "099"', () => {
    const data = digits.bytesToDigits(Buffer.from('6d09', 'hex'));
    expect(data).toBe('099');
});

// ..............................
// OTHER

test(`digitsToBytes ("${valDateISODigs}") -> "${resDateISODigs}"`, () => {
    const data = digits.digitsToBytes(valDateISODigs);
    expect(data.toString('base64')).toBe(resDateISODigs);
});

test(`bytesToDigits ("${resDateISODigs}") -> "${valDateISODigs}"`, () => {
    const buff = Buffer.from(resDateISODigs, 'base64');
    const data = digits.bytesToDigits(buff);
    expect(data).toBe(valDateISODigs);
});

test('getCreditCardMaskN16()', () => {
    const data = digits.getCreditCardMaskN16(valCCARDN16);
    expect(data).toBe(resCCARDN16);
});
