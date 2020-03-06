/**
 * XML
 *
 * A simple XML module that implements several methods that are absent in Node.js, 
 * the purpose of which is to convert data from XML text to an object and vice versa.
 * It's useful for the REST data exchanges. But it does not support text data tags 
 * with other tags inside, by now.
 *
 * usage:
 *   XML.stringify(xmlObject)
 *   XML.parse(xmlText)
 *
 * @file
 * @ingroup Modules
 * @version 1.0
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
 * Not supported for text data tags with other tags inside, for now.
 * 
 * @param {String} xmlText Text with an XML content
 * @param {Bool} includeRoot Whether should the root tag be included in the result of the object
 * @returns {Object} Nested object
 */
XML.parse = function XMLParser(xmlText, includeRoot=false) {
    const template = `<(\/)?([a-z-_]+)([^>]*?)(\/)?>`;
    const hashmap = {};
    const data = {};
    let dataEntry = data;
    let start = 0;
    let depth = 0;
    let matches;

    if (matches = /<\?xml(.*?)\?>/.exec(xmlText)) {
        const [ rawText, attrs ] = [ ...matches ];
        const tagName = 'xml';

        start += matches.index + rawText.length;

        if (includeRoot) {
            dataEntry = xmlUpdateDataEntry(dataEntry, tagName, attrs, XML.ATTR_SIGN);
            hashmap[ depth ] = xmlCreateHashmapRecord(dataEntry, tagName, start);

            depth += 1;
        } else if (attrs) {
            Object.assign(data, parseAttributes(attrs, XML.ATTR_SIGN));
        }
    }

    while (matches = new RegExp(template, 'img').exec(xmlText.substr(start))) {
        const [ rawText, PAIRED_CLOSED, tagName, attrs, SINGLE_CLOSED ] = [ ...matches ];
        start += matches.index + rawText.length;

        if (PAIRED_CLOSED) {
            depth -= 1;

            const end = start - rawText.length;
            const element = hashmap[ depth ];

            if (depth > 0) {
                dataEntry = hashmap[ depth-1 ].reference;
            }

            // Define as a primitive property
            if (!element.hasTags) {
                dataEntry[ element.tagName ] = xmlText.substring(element.start, end);
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
            dataEntry = xmlUpdateDataEntry(dataEntry, tagName, attrs, XML.ATTR_SIGN);
            hashmap[ depth ] = xmlCreateHashmapRecord(dataEntry, tagName, start);

            if (depth > 0) {
                hashmap[ depth-1 ].hasTags = true;
            }

            depth += 1;
        }

    }

    return data;
}

XML.stringify = function XMLStringify(xmlData, indent=4, version='1.0', encoding='UTF-8') {
    throw new Error('Method XML.stringify() not implemented yet');
}


function xmlUpdateDataEntry(entry, tagName, attrs, prefix='') {
    entry[ tagName ] = parseAttributes(attrs, prefix);
    return entry[ tagName ];
}

function xmlCreateHashmapRecord(reference, tagName, start) {
    return { hasTags: false, reference, tagName, start };
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
