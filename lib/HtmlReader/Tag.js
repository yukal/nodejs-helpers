'use strict';

const Tag = {};

Tag.POS_CONTNENT_START = 0;
Tag.POS_CONTNENT_END = 1;
Tag.POS_START = 2;
Tag.POS_END = 3;

Tag.CHR_PAIRED_CLOSED = '</';
Tag.CHR_SINGLE_CLOSED = '/>';
Tag.CHR_OPENED = String.fromCharCode(0x3c);
Tag.CHR_ENDED = String.fromCharCode(0x3e);

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element
 */
Tag.singleList = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'rb',
  'source',
  'track',
  'wbr',
]);

/**
 * isSingleTag
 * @see SingleTags
 * @param {String} tagName Tag name
 */
Tag.isSingle = (tagName) => Tag.singleList.has(tagName);

module.exports = Tag;
