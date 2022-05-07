'use strict';

/**
 * XML
 *
 * A simple XML module that implements several methods that are absent in Node.js, 
 * the purpose of which is to convert data from XML text to an object and vice versa.
 *
 * usage:
 *   XML(object)
 *   XML(text)
 *   XML.stringify(xmlObject)
 *   XML.parse(xmlText)
 *   XML.parseAttributes(xmlObject)
 *   XML.fetchAttributes(xmlObject)
 *
 * @file
 * @ingroup Modules
 * @version 1.6-beta
 * @license MIT
 * @author Alexander Yukal <yukal.alexander@gmail.com>
 */

/**
 * A character for the paired-tag key-name attribute.
 *
 * Example:
 *   <package fruit="banana">
 *       <fruit tasty="yes" ripe="80%" />
 *   </package>
 *
 * Result:
 *   {
 *       "package": {
 *           "@fruit": "banana",
 *           "fruit": {
 *                "tasty": "yes",
 *                "ripe": "80%"
 *           }
 *       }
 *   }
 */
const XML_ATTR_AT = '@';
const XML_ATTR_TEXT = '&text';

const XML_DEFAULT_VERSION = '1.0';
const XML_DEFAULT_ENCODING = 'UTF-8';
const XML_DEFAULT_BR = '\n';
const XML_DEFAULT_INDENT = '  ';

const T_OBJECT = 1;
const T_ARRAY = 2;

/**
 * XML
 *
 * @see XML.parse
 * @see XML.stringify
 *
 * @param {string|object} textOrObject A text or object with XML data
 * @returns A text or object with XML data
 */
const XML = (textOrObject) => {
  const methodName = typeof (textOrObject) === 'string' ? 'parse' : 'stringify';
  const method = XML[methodName];

  return method.call(XML, textOrObject);
};

/**
 * XML.parse
 * Parse an XML text and return the result as a data object.
 *
 * @param {string} xmlText 
 * @returns object
 */
XML.parse = (xmlText) => {
  const tree = {};

  let matches = /<\?xml(.*?)\?>/im.exec(xmlText);
  if (matches !== null) {
    const [row, params] = matches;
    const attributes = XML.parseAttributes(params, XML_ATTR_AT);

    if (attributes.hasOwnProperty('@encoding')) {
      attributes['@encoding'] = attributes['@encoding'].toLowerCase();
    }

    Object.assign(tree, attributes);
    Object.defineProperty(tree, 'attrsLength', {
      value: attributes.attrsLength,
      // writable: true,
    });
  }

  const reg = /<\/?([:\w_-]+)([^>]*)>/m;
  const options = {
    matches: reg.exec(xmlText),
    depth: 0,
    tree,
    elements: {},
    text: '',
  };

  while (options.matches !== null) {
    const singleClosed = options.matches[0].endsWith('/>');
    const pairedClosed = options.matches[0].startsWith('</');

    if (singleClosed) {

      options.text = '';
      xmlParseClosedSingleTag(options);

    } else if (pairedClosed) {

      options.text = xmlText.slice(0, options.matches.index).trim();
      xmlParseClosedPairedTag(options);

    } else {

      options.text = xmlText.slice(0, options.matches.index).trim();
      xmlParseOpenedPairedTag(options);

    }

    xmlText = xmlText.slice(options.matches.index + options.matches[0].length);
    options.matches = reg.exec(xmlText);
  }

  return tree;
};

XML.stringify = (object, options) => {
  if (Type(object) !== 'object') {
    return '';
  }

  const clone = { ...object };
  const initiatedOptions = stringifyInitOptions(options);

  const params = stringifyParams(clone, initiatedOptions);
  const body = XML.stringifyBody(clone, initiatedOptions);

  return `<?xml ${params}?>${body}`;
};

XML.stringifyBody = (object, options) => {
  if (Type(object) !== 'object') {
    return '';
  }

  const initiatedOptions = stringifyInitOptions(options);

  const pocket = {};
  let entries = Object.keys(object);
  let hasEntries = entries.length > 0;
  let indentDepth = 0;
  let depth = 0;
  let body = '';

  pocket[depth] = {
    key: 'root',
    val: object,
    entries,
    attribs: '',
    body: '',
    hasChilds: false,
    type: T_OBJECT,
  };

  while (hasEntries) {
    const pocketItem = pocket[depth];
    const indent = calcIndentation(indentDepth, initiatedOptions);

    if (entries.length > 0) {
      const key = entries[0];
      const val = pocketItem.val[key];

      if (key.startsWith(XML_ATTR_AT)) {
        pocketItem.attribs += ` ${key.slice(1)}="${val}"`;

        delete pocketItem.val[key];
        entries.shift();

        continue;
      }

      if (key.startsWith(XML_ATTR_TEXT)) {
        const indent = calcIndentation(indentDepth, initiatedOptions);
        const body = Array.isArray(val)
          ? val.join(indent) : val;

        pocketItem.body += `${indent}${body}`;

        delete pocketItem.val[key];
        entries.shift();

        continue;
      }

      switch (Type(val)) {
        case 'object':
          pocketItem.hasChilds = true;
          entries = Object.keys(val);

          depth++;
          indentDepth++;

          pocket[depth] = {
            key,
            val,
            entries,
            attribs: '',
            body: '',
            hasChilds: false,
            type: T_OBJECT,
          };
          break;

        case 'array':
          pocketItem.hasChilds = true;
          entries = Object.keys(val);

          depth++;

          pocket[depth] = {
            key,
            val,
            entries,
            attribs: '',
            body: '',
            hasChilds: false,
            type: T_ARRAY,
          };
          break;

        case 'boolean':
        case 'number':
        case 'bigint':
        case 'string':
          const tagName = pocketItem.type === T_ARRAY
            ? pocketItem.key : key;

          pocketItem.body += `${indent}<${tagName}>${val}</${tagName}>`;
          entries.shift();
          break;

        default:
          entries.shift();
          break;
      }
    } else {
      if (depth > 0) {
        const { key, type, body, attribs, hasChilds } = pocket[depth];

        delete pocket[depth];
        depth--;

        const pocketItem = pocket[depth];
        entries = pocketItem.entries;
        entries.shift();

        if (type === T_ARRAY) {
          pocketItem.body += body;
        }

        if (type === T_OBJECT) {
          indentDepth--;

          const indent = calcIndentation(indentDepth, initiatedOptions);
          const tagName = pocketItem.type === T_ARRAY
            ? pocketItem.key : key;

          pocketItem.body += body.length || hasChilds
            ? `${indent}<${tagName}${attribs}>${body}${indent}</${tagName}>`
            : `${indent}<${tagName}${attribs} />`;
        }

        continue;
      }

      body = pocket[depth].body;
      delete pocket[depth];

      hasEntries = false;
    }
  }

  return body;
};

XML.parseAttributes = (params, prefix = '') => {
  const reg = /(?<key>[:\w_-]+)=["'](?<val>[^"']+)['"]/;
  const attributes = {};
  let matches = reg.exec(params);
  let length = 0;

  while (matches !== null) {
    const [row, key, val] = matches;
    const attrKey = prefix + key.toLowerCase();

    params = params.slice(matches.index + row.length);
    matches = reg.exec(params);

    attributes[attrKey] = val;
    length++;
  }

  return Object.defineProperty(attributes, 'attrsLength', {
    value: length,
    // writable: true
  });
};

XML.fetchAttributes = (object) => {
  const attributes = {};

  for (const keyName in object) {
    if (keyName.startsWith(XML_ATTR_AT)) {
      const key = keyName.slice(XML_ATTR_AT.length);
      attributes[key] = object[keyName];
    }
  }

  return attributes;
};

const xmlParseClosedSingleTag = (options) => {
  const { depth, tree } = options;
  const [row, tagName, params] = options.matches;

  const currItem = options.elements[depth];
  const attributes = XML.parseAttributes(params);

  currItem.hasTags = true;

  if (currItem.data.hasOwnProperty(tagName)) {
    if (Array.isArray(currItem.data[tagName])) {

      currItem.data[tagName].push(attributes);

    } else {

      currItem.data[tagName] = [
        currItem.data[tagName],
        attributes
      ];

    }
  } else {

    currItem.data[tagName] = attributes;

  }

  // if (options.debug) {
  //   logTree(depth, tagName, params);
  // }
};

const xmlParseClosedPairedTag = (options) => {
  const [row, tagName, params] = options.matches;
  const { elements, depth, text } = options;

  const prevItem = elements[depth - 1];
  const currItem = elements[depth];

  if (!currItem.hasTags) {
    const isCurrItemAnArray = Array.isArray(prevItem.data[currItem.tagName]);

    if (isCurrItemAnArray) {

      const array = prevItem.data[currItem.tagName];
      const lastIndex = array.length - 1;
      const lastItem = array[lastIndex];

      if (lastItem.attrsLength === 0) {

        // save text as string
        array[lastIndex] = text;

      } else {

        // save text as object
        lastItem[XML_ATTR_TEXT] = text;

      }
    } else if (currItem.data.attrsLength) {

      currItem.data[XML_ATTR_TEXT] = text;

    } else {

      prevItem.data[currItem.tagName] = text;

    }

  } else {
    if (text.length) {
      if (currItem.data.hasOwnProperty(XML_ATTR_TEXT)) {
        if (Array.isArray(currItem.data[XML_ATTR_TEXT])) {

          currItem.data[XML_ATTR_TEXT].push(text);

        } else {

          currItem.data[XML_ATTR_TEXT] = [item, text];

        }
      } else {

        currItem.data[XML_ATTR_TEXT] = text;

      }
    }
  }

  // if (options.debug) {
  //   logTree(options.depth, tagName, params);
  // }

  delete elements[depth];
  options.depth--;
};

const xmlParseOpenedPairedTag = (options) => {
  options.depth++;

  const { depth, tree, elements } = options;
  const [row, tagName, params] = options.matches;
  const attributes = XML.parseAttributes(params, XML_ATTR_AT);

  if (depth === 1) {

    tree[tagName] = attributes;

  } else {

    // const currEntry = { [tagName]: XML.parseAttributes(params, XML_ATTR_AT) };
    const prev = elements[depth - 1];
    prev.hasTags = true;

    if (options.text.length) {
      if (!prev.data.hasOwnProperty(XML_ATTR_TEXT)) {

        prev.data[XML_ATTR_TEXT] = [options.text];

      } else {

        prev.data[XML_ATTR_TEXT].push(options.text);

      }
    }

    if (!prev.data.hasOwnProperty(tagName)) {

      prev.data[tagName] = attributes;

    } else {
      if (Array.isArray(prev.data[tagName])) {

        prev.data[tagName].push(attributes);

      } else {

        prev.data[tagName] = [
          prev.data[tagName],
          attributes,
        ];

      }
    }

  }

  elements[depth] = {
    tagName,
    data: attributes,
    hasTags: false
  };

  // if (options.debug) {
  //   logTree(depth, tagName, params);
  // }
};

const stringifyParams = (clone, options) => {
  let xmlParams = '';

  if (!clone.hasOwnProperty('@version')) {
    clone['@version'] = options.version != undefined
      ? options.version
      : XML_DEFAULT_VERSION;
  }

  if (!clone.hasOwnProperty('@encoding')) {
    clone['@encoding'] = options.encoding != undefined
      ? options.encoding
      : XML_DEFAULT_ENCODING;
  }

  for (const key in clone) {
    if (key.startsWith(XML_ATTR_AT)) {
      const lowerKey = key.slice(1).toLowerCase();
      xmlParams += ` ${lowerKey}="${clone[key]}"`;

      delete clone[key];
    }
  }

  return xmlParams.trim();
};

const stringifyInitOptions = (options) => {
  const defaultOptions = {
    version: XML_DEFAULT_VERSION,
    encoding: XML_DEFAULT_ENCODING,
    breakLine: XML_DEFAULT_BR,
    indentation: XML_DEFAULT_INDENT,
  };

  const initOptions = Type(options) === 'object'
    ? { ...options } : {};

  for (const key in defaultOptions) {
    if (!initOptions.hasOwnProperty(key)) {
      initOptions[key] = defaultOptions[key];
    }
  }

  return initOptions;
};

const calcIndentation = (depth, options) => {
  const { breakLine: br } = options;

  const space = depth > 0
    ? ' '.repeat(depth * 2)
    : '';

  return `${br}${space}`;
};

const Type = (obj) => {
  const signature = Object.prototype.toString.call(obj);
  return signature.slice(8, -1).toLowerCase();
}

module.exports = Object.freeze(XML);
