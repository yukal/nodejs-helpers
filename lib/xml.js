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
    static ATTR_SIGN = '@';

    /**
     * constructor
     * @param {string} version 
     * @param {string} encoding 
     * @param {object} config 
     */
    constructor(version = '1.0', encoding = 'UTF-8', config = {}) {
        // ...
    }

    /**
     * XML.parse
     * Parse the XML text and return the result as a data object.
     * 
     * @param {String} xmlText Text with an XML content
     * @param {Bool} rawInnerTags [optional] 
     * @returns {Object} Nested object
     */
    static parse(xmlText, rawInnerTags=true) {
        const template = `<(\/)?([:a-z-_]+)([^>]*?)(\/)?>`;
        const hashmap = {};
        const data = {};
        let dataEntry = data;
        let posStart = 0;
        let posLast = 0;
        let depth = 0;
        let matches;

        if (matches = /<\?xml(.*?)\?>/.exec(xmlText)) {
            const [ matchedText, attributes ] = [ ...matches ];
            posLast += matches.index + matchedText.length;
            posStart = posLast - matchedText.length;

            Object.assign(data, parseAttributes(attributes, XML.ATTR_SIGN));
        }

        while (matches = new RegExp(template, 'img').exec(xmlText.substr(posLast))) {
            const [
                matchedText,
                closedPairTag,
                tagName,
                attributes,
                closedSingleTag
            ] = [
                ...matches
            ];

            posLast += matches.index + matchedText.length;
            posStart = posLast - matchedText.length;

            if (closedPairTag) {
                depth -= 1;

                if (depth > 0) {
                    dataEntry = parseClosedPairTag(hashmap, depth, posStart, posLast, xmlText);
                }

                delete hashmap[ depth ];
                // logTree(depth, tagName, '/');
            }

            else if (closedSingleTag) {
                xmlParserUpdateDataEntry(dataEntry, tagName, attributes);
                // logTree(depth, tagName, '/');

                if (depth > 0) {
                    hashmap[ depth-1 ].hasTags = true;
                }
            }

            else { // opened pair tag
                // logTree(depth, tagName);

                if (depth > 0) {
                    const prevElement = hashmap[ depth-1 ];

                    prevElement.buf += xmlText.substring(prevElement.pos, posStart);
                    prevElement.pos = posLast;
                    prevElement.hasTags = true;
                }

                dataEntry = xmlParserUpdateDataEntry(dataEntry, tagName, attributes, XML.ATTR_SIGN);
                hashmap[ depth ] = xmlParserCreateHashmapRecord(dataEntry, tagName, posStart, posLast);

                depth += 1;
            }

        }

        return data;
    }

    static stringify(xmlData, indent=4, version='1.0', encoding='UTF-8') {
        throw new Error('Method XML.stringify() not implemented yet');
    }

    /**
     * getAttributes
     * Returns an object with attributes that begins with "@" char
     * @param {object} obj Object
     * @returns {object} Object with attributes or empty object
     */
    static getAttributes(obj) {
        const attributes = {};

        Object.keys(obj).map(key => {
            if (key[0] === '@') {
                attributes[ key.slice(1) ] = obj[ key ];
            }
        });

        return attributes;
    }

    /**
     * enter
     * Enters inside a nested path and returns the data inside the object
     * @param {object} obj Object with nested nodes
     * @param {string|array} path Path to a nested node (path="some node path" | path=["some", "node", "path"])
     * @param {string} keyPrefix [optional]
     * @returns {object|null}
     */
    static enter(obj, path, keyPrefix='') {
        if (!Array.isArray(path)) {
            path = path.split(' ');
        }

        let data = obj;
        let key;

        while(key = path.shift()) {
            key = `${keyPrefix}${key}`;

            if (data.hasOwnProperty(key)) {
                data = data[ key ];
            } else {
                return null;
            }
        }

        return data;
    }
}

function parseClosedPairTag(hashmap, depth, posStart, posLast, xmlText) {
    const prevElement = hashmap[depth-1];
    const currElement = hashmap[depth];
    const innerText = xmlText.substring(hashmap[depth].pos, posStart);

    if (currElement.pos == prevElement.pos) {
        prevElement.buf += innerText.trim();
        prevElement.pos = posLast;

        if (innerText.length) {
            if (prevElement.reference.hasOwnProperty(currElement.tagName)) {
                if (typeof currElement.reference == 'string') {
                    // Update primitive property
                    currElement.reference += innerText;
                } else {
                    currElement.reference._innerText = innerText.trim();
                    currElement.reference._outerText = xmlText.substring(currElement.posStartTag, posLast);
                }
            } else {
                if (currElement.hasAttributes) {
                    currElement.reference._innerText = innerText.trim();
                    currElement.reference._outerText = xmlText.substring(currElement.posStartTag, posLast);
                } else {
                    // Define as a primitive property
                    prevElement.reference[ currElement.tagName ] = innerText;
                }
            }
        }

    } else {

        currElement.buf += innerText;

        if (/\S/.test(currElement.buf)) {
            if (currElement.hasAttributes || currElement.hasTags) {
                currElement.reference._innerText = xmlText.substring(currElement.posStartText, posStart).trim();
                currElement.reference._outerText = xmlText.substring(currElement.posStartTag, posLast).trim();
            } else {
                // Define as a primitive property
                currElement.reference = innerText;
            }
        }

    }

    return prevElement.reference;
}

function xmlParserUpdateDataEntry(entry, tagName, attrs, prefix='') {
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

function xmlParserCreateHashmapRecord(reference, tagName, posStartTag, posLast) {
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

    while (matches = /([:\w]+)\s*=\s*["'](.*?)['"]/img.exec(text.substr(last))) {
        let [ matchedText, propertyName, value ] = [ ...matches ];
        propertyName = prefix + propertyName;
        last += matches.index + matchedText.length;
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
