'use strict';

/**
 * XML
 *
 * A simple XML module that implements several methods that are absent in Node.js, 
 * the purpose of which is to convert data from XML text to an object and vice versa.
 * It's useful for the REST/SOAP data exchanges.
 *
 * usage:
 *   XML.stringify(xmlObject)
 *   XML.parse(xmlText)
 *   XML.enter(xmlObject, 'data object_complex data')
 *   XML.getAttributes(xmlObject)
 *
 * @file
 * @ingroup Modules
 * @version 1.5-beta
 * @license MIT
 * @author Alexander Yukal <yukal@email.ua>
 */

const XML = {};

/**
 * XML._ATTR_SIGN
 * A symbol for the paired-tag key-name attribute.
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
XML._ATTR_SIGN = '@';

/**
 * XML._POCKET_NAME
 * The entry name where the temporary data of the search results 
 * should locate in on parsing an XML text.
 */
XML._POCKET_NAME = '*POCKET*';

/**
 * XML.parse
 * Parse the XML text and return the result as a data object.
 * 
 * @param {String} xmlText Text with an XML content
 * @param {Object} options [optional] 
 * @returns {Object} Nested object
 */
XML.parse = function parse(xmlText, options = {}) {
    const template = `<(\/)?([:\\w-_]+)([^>]*?)(\/)?>`;
    const data = {};

    data[XML._POCKET_NAME] = {
        xmlText: xmlText,
        data: data,
        datamap: {},
        lastPosition: 0,
        depth: 0,
        posStart: 0,
        posEnd: 0
    };

    const pocket = data[XML._POCKET_NAME];
    let matches;

    // There may be large text data, so it is better 
    // to clean the variable for the current closure
    xmlText = null;

    const showTree = options.hasOwnProperty('showTree')
        ? options.showTree
        : false
    ;

    if (matches = /<\?xml(.*?)\?>/.exec(pocket.xmlText)) {
        const [matchedText, tagAttributes] = [...matches];
        pocket.posEnd += matches.index + matchedText.length;
        pocket.posStart = pocket.posEnd - matchedText.length;

        Object.assign(data, parseAttributes(tagAttributes, XML._ATTR_SIGN));
    }

    while (matches = new RegExp(template, 'img').exec(pocket.xmlText.slice(pocket.posEnd))) {
        const [matchedText, closedTag, tagName, tagAttributes, singleTag] = [...matches];

        pocket.posEnd += matches.index + matchedText.length;
        pocket.posStart = pocket.posEnd - matchedText.length;

        if (singleTag) {

            parseSingleTag(pocket, tagName, tagAttributes);
            showTree && logTree(pocket.depth, tagName, singleTag);

        } else if (closedTag) {

            parseClosedTag(pocket);
            showTree && logTree(pocket.depth, tagName, closedTag);

        } else {

            showTree && logTree(pocket.depth, tagName);
            parseOpenedTag(pocket, tagName, tagAttributes);

        }
    }

    delete data[XML._POCKET_NAME];
    return data;
}

XML.stringify = function stringify(xmlData, indent = 4, version = '1.0', encoding = 'UTF-8') {
    throw new Error('Method XML.stringify() not implemented yet');
}

/**
 * getAttributes
 * Returns an object with attributes that begins with "@" char
 * @param {object} obj Object
 * @returns {object} Object with attributes or empty object
 */
XML.getAttributes = function getAttributes(obj) {
    const attributes = {};

    for (const key in obj) {
        if (key[0] === '@') {
            attributes[key.slice(1)] = obj[key];
        }
    }

    return attributes;
}

/**
 * enter
 * Enters inside a nested path and returns the data inside the object.
 * It does not work with arrays
 * @param {object} obj Object with nested nodes
 * @param {string|array} path Path to a nested node (path="some node path" | path=["some", "node", "path"])
 * @param {string} keyPrefix [optional]
 * @returns {object|null}
 */
XML.enter = function enter(obj, path, keyPrefix = '') {
    if (!Array.isArray(path)) {
        path = path.split(' ');
    }

    let data = obj;
    let key;

    while (key = path.shift()) {
        key = `${keyPrefix}${key}`;

        if (data.hasOwnProperty(key)) {
            data = data[key];
        } else {
            return null;
        }
    }

    return data;
}

function parseSingleTag(pocket, tagName, tagAttributes) {
    const attributes = parseAttributes(tagAttributes);

    if (pocket.data.hasOwnProperty(tagName)) {
        const existNode = pocket.data[tagName];

        if (Array.isArray(existNode)) {
            existNode.push(attributes);
        } else {
            pocket.data[tagName] = [existNode, attributes];
        }

    } else {
        pocket.data[tagName] = attributes;
    }

    // Update parent node
    if (pocket.depth > 0) {
        const parentNode = pocket.datamap[pocket.depth - 1];
        parentNode.outsideText += pocket.xmlText.substring(parentNode.lastPosition, pocket.posStart);
        parentNode.lastPosition = pocket.posEnd;
        parentNode.hasTags = true;
    }
}

function parseOpenedTag(pocket, tagName, tagAttributes) {
    const { attributes, hasAttributes } = parseAttributes(tagAttributes, XML._ATTR_SIGN, true);

    if (pocket.depth > 0) {
        // Update parent node
        const parentNode = pocket.datamap[pocket.depth - 1];
        parentNode.outsideText += pocket.xmlText.substring(parentNode.lastPosition, pocket.posStart);
        parentNode.lastPosition = pocket.posStart;
        parentNode.hasTags = true;
    }

    if (pocket.data.hasOwnProperty(tagName)) {
        const existNode = pocket.data[tagName];

        if (Array.isArray(existNode)) {
            hasAttributes
                ? existNode.push(attributes)
                : existNode.push(null)
            ;
        }
        else {
            pocket.data[tagName] = getType(existNode, 'object') && isEmptyObject(existNode)
                ? [null, attributes]
                : [existNode, attributes]
            ;
        }

    } else {
        pocket.data[tagName] = attributes;
    }

    pocket.data = pocket.data[tagName];
    pocket.datamap[pocket.depth] = {
        hasAttributes,
        hasTags: false,
        data: attributes,
        tagName,
        posStartTag: pocket.posStart,
        posStartText: pocket.posEnd,
        lastPosition: pocket.posEnd,
        outsideText: ''
    }

    pocket.depth += 1;
}

function parseClosedTag(pocket) {
    pocket.depth -= 1;

    if (pocket.depth > 0) {
        const parentNode = pocket.datamap[pocket.depth - 1];
        const currentNode = pocket.datamap[pocket.depth];

        // Is the current nested list node ending
        if (currentNode.posStartTag === parentNode.lastPosition) {
            currentNode.outsideText += pocket.xmlText.substring(currentNode.lastPosition, pocket.posStart);

            // Is any non-space char present inside the current node
            // excluding the inner tags (outside of the inner tags)
            if (/\S/.test(currentNode.outsideText) && currentNode.hasTags) {
                currentNode.data._innerText = pocket.xmlText.substring(currentNode.posStartText, pocket.posStart).trim();
                currentNode.data._outerText = pocket.xmlText.substring(currentNode.posStartTag, pocket.posEnd).trim();
            }
        }

        if (!currentNode.hasTags) {
            const currData = parentNode.data[currentNode.tagName];
            const innerText = pocket.xmlText.substring(currentNode.lastPosition, pocket.posStart);
            // const outerText = pocket.xmlText.substring(currentNode.posStartTag, posLast);

            if (!currentNode.hasAttributes) {
                // Update last item of array
                if (Array.isArray(currData)) {
                    // Array data
                    // <array>item1</array>
                    // <array>item2</array>
                    // <array></array>
                    // converts to: 
                    //   { "array": ["item1", "item2", null] }
                    currData[currData.length - 1] = innerText.length ? innerText : null;
                }

                // Update as a primitive property
                else if (innerText.length > 0) {
                    // Textual data
                    // <textual>hello world!</textual>
                    // converts (as is) to: 
                    //   { "textual": "hello world!" }
                    parentNode.data[currentNode.tagName] = innerText;
                }

                else if (getType(currData, 'object')) {
                    // Nullable data
                    // <somedata></somedata>
                    // converts to: 
                    //   { "somedata": null }
                    parentNode.data[currentNode.tagName] = null;
                }
            } else {
                // Paired tag with text and attributes
                // <text_data attribute="1">text data</text_data>
                // converts to:
                //   "text_data": {
                //     "@attribute": "1"
                //     "data": "text data"
                //   }
                currentNode.data.data = innerText;
            }
        }

        // Update parent node
        parentNode.lastPosition = pocket.posEnd;

        // Back to a parent node
        pocket.data = parentNode.data;
    }

    // There will be no more data in the current node,
    // so, we need to clean the datamap with this node
    delete pocket.datamap[pocket.depth];
}

function parseAttributes(text, prefix = '', asBundle = false) {
    const bundle = {
        hasAttributes: false,
        attributes: {}
    };
    let last = 0;
    let matches;

    while (matches = /([:\w]+)\s*=\s*["'](.*?)['"]/img.exec(text.substr(last))) {
        let [matchedText, propertyName, value] = [...matches];
        propertyName = prefix + propertyName;
        last += matches.index + matchedText.length;
        bundle.hasAttributes = true;
        bundle.attributes[propertyName] = value;
    }

    return asBundle ? bundle : bundle.attributes;
}

function isEmptyObject(obj) {
    for (const item in obj) {
        return false;
    }
    return true;
}

function getType(obj, expectedType) {
    const fullSignature = Object.prototype.toString.call(obj);
    const shortSignature = fullSignature.slice(8, -1).toLowerCase();

    return expectedType !== undefined
        ? shortSignature === expectedType
        : shortSignature
    ;
}

function logTree() {
    const args = [...arguments];
    const depth = args.shift();
    let color = depth;

    if (color < 1) {
        color = 1;
    }

    if (color > 14) {
        color %= 14;
    }

    const values = ' %s'.repeat(args.length);
    const template = `\x1B[38;05;${color}m%s %s${values}\x1B[0m`;
    const indent = ' '.repeat(depth * 4);

    console.log.apply(console, [template, depth, indent].concat(args));
}

module.exports = XML;
