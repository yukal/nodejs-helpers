'use strict';

/**
 * Digits Helper
 *
 * usage:
 *   const ccmask = getCreditCardMaskN16("1234567890123456");
 *   const buffer = digitsToBytes("12345678901234560011222");
 *   const digits = bytesToDigits(buffer);
 *
 * @file
 * @ingroup Helper
 * @version 1.0
 * @license MIT
 * @author Alexander Yukal <yukal@email.ua>
 */

/**
 * getCreditCardMaskN16
 * Convert 16 digits length credit card number 
 * to a specific representation: 
 * "NNNNNNNNNNNNNNNN" => "NNNN NNNN NNNN NNNN"
 * "1234567890123456" => "1234 5678 9012 3456"
 * 
 * @param {string} cn Credit Card Number
 */
function getCreditCardMaskN16(cn) {
  const chunks = cn.match(/\d{4}/g);
  return Array.isArray(chunks) ? chunks.join(' ') : '';
}

/**
 * digitsToBytes
 * Encompresses digits to the bytes and represents it as a Buffer data.
 * It ties up each pair of two digits and converts it to ASCII byte codes 
 * in numeric format.
 * @see bytesToDigits
 *
 * @param {string} str String with digits only
 * @returns {buffer} Buffer
 */
function digitsToBytes(str) {
  const buff = str
    // Remove all except digits
    .replace(/\D/g, '')

    // Ties up the paired stringed numbers and returns it as an array
    // example: 01234 => ['01','23','4']
    .match(/\d{1,2}/g)

    // Converts string chunks to digits (including a leading zero).
    // If you take a look at two different arrays you will see the same result as 
    // buffered data representation but for the string data it would be different 
    // data, and when you will try to decode it, it would give the wrong data.
    // So thats because the number with a leading zero should start from 100
    // 
    // const buff1 = [
    //     '0', '1', '2', '3',
    //     '4', '5', '6', '7',
    //     '8', '9', '10'
    // ]
    // 
    // const buff2 = [
    //     '00', '01', '02',
    //     '03', '04', '05',
    //     '06', '07', '08',
    //     '09', '10'
    // ]
    // 
    // buff1.join('')  "012345678910"
    // buff2.join('')  "0001020304050607080910"
    // 
    // Buffer.from(buff1)  <Buffer 00 01 02 03 04 05 06 07 08 09 0a>
    // Buffer.from(buff2)  <Buffer 00 01 02 03 04 05 06 07 08 09 0a>

    .map(n => n.length == 2 && n < 10 ? +n + 100 : +n)
  ;

  return Buffer.from(buff);
}

/**
 * bytesToDigits
 * Decompresses buffer encoded by digitsToBytes method
 * @see digitsToBytes
 *
 * @param {buffer} buff Buffer
 * @returns {string} Digits in a string representation
 */
function bytesToDigits(buff) {
  let digits = '';

  for (const n of buff) {
    digits += n > 99 ? `0${n - 100}` : `${n}`;
  }

  return digits;
}

/**
 * bytesToShortSize
 * bKMGTPEZYB: byte kilo mega giga tera peta exa zetta yotta bronto
 * @param {int} size Size in bytes
 * @param {int} measure
 * @param {string} markers String with short markers (Default is "bKMGTPEZYB")
 */
function bytesToShortSize(size, fixed = 1, measure = 1024, markers = 'bKMGTPEZYB') {
  let rate = 0;

  while (size >= measure) {
    size /= measure;
    rate++;
  }

  if (rate > 0) {
    size = size.toFixed(fixed);

    if (fixed) {
      const fraction = size.slice(-fixed - 1);
      const expected = '.' + ('0'.repeat(fixed));

      // remove zeros in a fraction
      if (fraction == expected) {
        size = size.replace(/\..*$/, '');
      }
    }
  }

  return rate > 0
    ? `${size}${markers[rate]}b`
    : `${size}${markers[rate]}`
  ;
}

/**
 * bytesToShortSize
 * bKMGTPEZYB: byte kilo mega giga tera peta exa zetta yotta bronto
 * @param {int} size Size in bytes
 * @param {int} measure
 * @param {string} markers String with short markers (Default is "bKMGTPEZYB")
 */
function bytesToFixedSize(size, fixed = 1, measure = 1024, markers = 'bKMGTPEZYB') {
  let rate = 0;

  while (size >= measure) {
    size /= measure;
    rate++;
  }

  return rate > 0
    ? `${size.toFixed(fixed)}${markers[rate]}b`
    : `${size.toFixed(fixed)}${markers[rate]}`
  ;
}

module.exports = {
  getCreditCardMaskN16,
  digitsToBytes,
  bytesToDigits,
  bytesToShortSize,
  bytesToFixedSize
};
