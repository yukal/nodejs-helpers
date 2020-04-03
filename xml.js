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
 *
 * @file
 * @ingroup Modules
 * @version 1.2-beta
 * @license MIT
 * @author Alexander Yukal <yukal@email.ua>
 */

class XML {
    constructor(version = '1.0', encoding = 'UTF-8', config = {}) {
        // ...
    }
}

/**
 * XML.ATTR_SIGN
 * The symbol for the paired-tag key-name attribute.
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
XML.ATTR_SIGN = '@';

/**
 * XML.parse
 * Parse the XML text and return the result as a data object.
 * 
 * @param {String} xmlText Text with an XML content
 * @param {Bool} rawInnerTags [optional] 
 * @returns {Object} Nested object
 */
XML.parse = function XMLParser(xmlText, rawInnerTags=true) {
    const template = `<(\/)?([:a-z-_]+)([^>]*?)(\/)?>`;
    const hashmap = {};
    const data = {};
    let dataEntry = data;
    let posStart = 0;
    let posLast = 0;
    let depth = 0;
    let matches;

    if (matches = /<\?xml(.*?)\?>/.exec(xmlText)) {
        const [ rawText, attrs ] = [ ...matches ];
        posLast += matches.index + rawText.length;
        posStart = posLast - rawText.length;

        Object.assign(data, parseAttributes(attrs, XML.ATTR_SIGN));
    }

    while (matches = new RegExp(template, 'img').exec(xmlText.substr(posLast))) {
        const [ rawText, PAIRED_CLOSED, tagName, attrs, SINGLE_CLOSED ] = [ ...matches ];
        posLast += matches.index + rawText.length;
        posStart = posLast - rawText.length;

        if (PAIRED_CLOSED) {
            depth -= 1;

            const element = hashmap[ depth ];
            const innerText = xmlText.substring(element.pos, posStart);

            if (depth > 0) {
                const topElement = hashmap[ depth-1 ];
                dataEntry = topElement.reference;

                if (element.pos == topElement.pos) {
                    topElement.buf += innerText.trim();
                    topElement.pos = posLast;

                    if (innerText.length) {
                        if (dataEntry.hasOwnProperty(element.tagName)) {
                            if (typeof element.reference == 'string') {
                                // Update primitive property
                                element.reference += innerText;
                            } else {
                                element.reference._innerText = innerText.trim();
                                element.reference._outerText = xmlText.substring(element.posStartTag, posLast);
                            }
                        } else {
                            if (element.hasAttributes) {
                                element.reference._innerText = innerText.trim();
                                element.reference._outerText = xmlText.substring(element.posStartTag, posLast);
                            } else {
                                // Define as a primitive property
                                dataEntry[ element.tagName ] = innerText;
                            }
                        }
                    }

                } else {

                    element.buf += innerText;

                    if (/\S/.test(element.buf)) {
                        if (element.hasAttributes || element.hasTags) {
                            element.reference._innerText = xmlText.substring(element.posStartText, posStart).trim();
                            element.reference._outerText = xmlText.substring(element.posStartTag, posLast).trim();
                        } else {
                            // Define as a primitive property
                            element.reference = innerText;
                        }
                    }

                }
            }

            delete hashmap[ depth ];
            // logTree(depth, tagName, '/');
        }

        else if (SINGLE_CLOSED) {
            xmlUpdateDataEntry(dataEntry, tagName, attrs);
            // logTree(depth, tagName, '/');

            if (depth > 0) {
                hashmap[ depth-1 ].hasTags = true;
            }
        }

        else {
            // logTree(depth, tagName);

            if (depth > 0) {
                const topElement = hashmap[ depth-1 ];

                topElement.buf += xmlText.substring(topElement.pos, posStart);
                topElement.pos = posLast;
                topElement.hasTags = true;
            }

            dataEntry = xmlUpdateDataEntry(dataEntry, tagName, attrs, XML.ATTR_SIGN);
            hashmap[ depth ] = xmlCreateHashmapRecord(dataEntry, tagName, posStart, posLast);

            depth += 1;
        }

    }

    return data;
}

XML.stringify = function XMLStringify(xmlData, indent=4, version='1.0', encoding='UTF-8') {
    throw new Error('Method XML.stringify() not implemented yet');
}


function xmlUpdateDataEntry(entry, tagName, attrs, prefix='') {
    const attributes = parseAttributes(attrs, prefix);

    if (entry.hasOwnProperty(tagName)) {
        const currEntry = entry[ tagName ];

        if (Array.isArray(currEntry)) {
            currEntry.push(attributes);
        } else {
            entry[ tagName ] = [ currEntry, attributes ];
        }

    } else {
        entry[ tagName ] = attributes;
    }

    return attributes;
}

function xmlCreateHashmapRecord(reference, tagName, posStartTag, posLast) {
    return {
        hasAttributes: Object.keys(reference).length ?true :false,
        hasTags: false,
        reference,
        tagName,
        posStartTag,
        posStartText: posLast,
        pos: posLast,
        buf: ''
    };
}

function parseAttributes(text, prefix='') {
    const attributes = {};
    let last = 0;
    let matches;

    while (matches = /([\w]+)=["'](.*?)['"]/img.exec(text.substr(last))) {
        let [ rawText, propertyName, value ] = [ ...matches ];
        propertyName = prefix + propertyName;
        last += matches.index + rawText.length;
        attributes[ propertyName ] = value;
    }

    return attributes;
}

function logTree() {
    const args = [ ...arguments ];
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
