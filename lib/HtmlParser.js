/**
 * HtmlParser
 *
 * @file
 * @ingroup Modules
 * @version 1.4
 * @license MIT
 * @author Alexander Yukal <yukal@email.ua>
 */

class HtmlParser {
    constructor(html) {
        // Define Html text as readonly property
        Object.defineProperty(this, 'html', {
            enumerable: true,
            value: html,
        })
    }

    /**
     * findOne
     *
     * Searching the Html tag by a specific path of Html tree. 
     * Example: "div#box1 a img", "div.box a img[src|width|height]"
     *
     * Details:
     * If attributes are passed with the last tag in the first argument, the result 
     * should return an object with the selected attributes, otherwise, it returns 
     * the list of ParseResult objects.
     * If the second argument passed as Html-text, the search for the necessary tag 
     * will be carried out in this text.
     * If the second argument passed as ParseResult, the search for the necessary tag 
     * will be carried out by relative coordinates of the passed object.
     *
     * @param {String} path A path to an Html tag
     * @param {String|ParseResult} searchParams [optional] Html text or ParseResult object
     * @returns {Object} ParseResult or Object with chosen attributes
     */
    findOne(path, searchParams) {
        let selector = '';
        let pathChunks = path.split(' ');
        const lastSelector = pathChunks.pop();

        if (pathChunks.length) {
            while (selector = pathChunks.shift()) {
                searchParams = search.call(this, selector, searchParams, true);
            }
        }

        return search.call(this, lastSelector, searchParams, true);
    }

    /**
     * findAll
     *
     * Searching more than one of the Html tag by a specific path of Html tree.
     * Example: "div#box1 a img", "div.box a img[src|width|height]"
     *
     * Details:
     * If attributes are passed with the last tag in the first argument, the result 
     * should return the list of objects with the selected attributes, otherwise, 
     * it returns the list of ParseResult objects.
     * If the second argument passed as Html-text, the search for the necessary tag 
     * will be carried out in this text.
     * If the second argument passed as ParseResult, the search for the necessary tag 
     * will be carried out by relative coordinates of the passed object.
     *
     * @param {String} path A path to an Html tag
     * @param {String|ParseResult} searchParams [optional] Html text or ParseResult object
     * @returns {Array} list with ParseResult objects or list with attributes from searched tags
     */
    findAll(path, searchParams) {
        let selector = '';
        let pathChunks = path.split(' ');
        const lastSelector = pathChunks.pop();

        if (pathChunks.length) {
            while (selector = pathChunks.shift()) {
                searchParams = search.call(this, selector, searchParams, true);
            }
        }

        return search.call(this, lastSelector, searchParams, false);
    }

    getFormsData(target) {
        let data = this.html;
        let matches;
        let formData;
        let position = 0;
        let start = -1;
        let end = -1;
        const forms = [];

        while (matches = /<(\/?form).*?>/im.exec(data)) {
            const [ tpl, tag ] = [ ...matches ];
            let { index, groups } = matches;

            let last = index + tpl.length;
            position += last;
            data = data.substr(last);

            if (tag == 'form') {
                const attributes = parseHTML(tpl, 'attributes');

                if (target && !isMatchedAttribute(target, attributes)) {
                    continue;
                }

                forms.push(attributes);
                formData = forms[ forms.length-1 ];
                formData.values = {};
                start = position;
            }

            else if (tag == '/form' && position>start && start>-1) {
                end = position - tpl.length;
                const html = this.html.substring(start, end);
                formData.values = getFormChildItems(html);

                start = -1;
                end = -1;
            }
        }

        return target ?forms.shift() :forms;
    }

    findSelects(searchParams) {
        const blocks = this.findAll('select', searchParams);

        for (const block of blocks) {
            block.values = {};
            const options = this.findAll('option', block);
            options.map(option => block.values[option.attributes.value] = option.html);
        }

        return blocks;
    }
}

// Content beginning
HtmlParser.BGN_CONTNENT = 0;

// Content ending
HtmlParser.END_CONTNENT = 1;

// Tag beginning
HtmlParser.BGN_TAG = 2;

// Tag ending
HtmlParser.END_TAG = 3;

HtmlParser.TAG_OPENED = String.fromCharCode(0x3C);
HtmlParser.TAG_CLOSED = '</';
HtmlParser.TAG_ENDED = String.fromCharCode(0x3E);


/**
 * Wrapper for a searching result of the HtmlParser
 */

class ParseResult {}

ParseResult.define = function defineParseResultData(matches, attributes, position, isPairedTag) {
    const [ tagHtml, tagDefine, tagName, tagParams ] = [ ...matches ];
    const self = this;

    const tag = [ tagName, tagHtml ];
    const coords = isPairedTag
        ? [ position, 0, position-tagHtml.length, 0 ]
        : [ position-tagHtml.length, position ]
    ;

    const descriptors = Object.getOwnPropertyDescriptors({
        attributes, tag, coords,
    });

    const data = Object.create(ParseResult.prototype, descriptors);

    Object.defineProperty(data, 'html', {
        get: function getHtml() {
            return self.html.substring(this.coords[0], this.coords[1]);
        },
        enumerable: true,
        configurable: true,
    });

    return data;
}

HtmlParser.ParseResult = ParseResult;


function search(selector, searchParams, firstMatch=false) {
    const self = this;
    const tags = [];
    const tagsMap = { length: 0 };
    let tagDepth = 0;
    let tagStart = 0;
    let tagEnd = this.html.length;
    let matches;

    const target = parseSelectorParams(selector);
    const template = target.hasOwnProperty('tagName')
        ? `(</?)(${target.tagName})([^>]*?)>`
        : `(</?)([a-z]+)([^>]*?)?>`
    ;

    // if (!target) {
    //     return ;
    // }

    if (searchParams instanceof ParseResult) {
        tagStart = searchParams.coords[ HtmlParser.BGN_CONTNENT ] || searchParams.coords[ HtmlParser.BGN_TAG ];
        tagEnd = searchParams.coords[ HtmlParser.END_CONTNENT ] || searchParams.coords[ HtmlParser.END_TAG ];
    }

    while (matches = new RegExp(template, 'img').exec(self.html.substring(tagStart, tagEnd))) {
        const [ tagHtml, tagDefine, tagName, tagParams ] = [ ...matches ];
        const isSingle = isSingleTag(tagName);
        const isPaired = !isSingle;
        tagStart += matches.index + tagHtml.length;

        if (HtmlParser.TAG_OPENED == tagDefine) {
            isPaired && tagDepth++;
            // isPaired && logTree(tagHtml, tagDefine, tagDepth);

            const attributes = parseTagAttributes(tagParams);
            if (!isMatchedAttribute(target, attributes)) {
                continue;
            }

            if (target.hasOwnProperty('attributes')) {
                if (firstMatch) {
                    return getItems(attributes, target.attributes);
                }
                tags.push(getItems(attributes, target.attributes));
                continue;
            }

            const data = ParseResult.define.call(this, matches, attributes, tagStart, isPaired);

            // Processing non-paired tags
            if (firstMatch && isSingle && (target.isSingle || tagsMap.length==0)) {
                // if (target.isSingle || tagsMap.length==0) {
                    return data;
                // }
            }

            tags.push(data);

            // Processing paired tags
            if (isPaired) {
                tagsMap[ tagDepth-1 ] = tags.length-1;
                tagsMap.length += 1;
            }
        }

        else if (HtmlParser.TAG_CLOSED == tagDefine) {
            tagDepth--;
            // logTree(tagHtml, tagDefine, tagDepth);

            if (!tagsMap.hasOwnProperty(tagDepth)) {
                continue;
            }

            const data = tags[tagsMap[tagDepth]];
            data.tag.push(tagHtml);
            data.coords[ HtmlParser.END_CONTNENT ] = tagStart-tagHtml.length;
            data.coords[ HtmlParser.END_TAG ] = tagStart;

            delete tagsMap[ tagDepth ];
            tagsMap.length -= 1;

            if (firstMatch && tagsMap.length==0) {
                return data;
            }
        }

    } // End while

    return firstMatch ?null :tags;
}

function getItems(data, items) {
    function parse(object, items) {
        const data = {};
        items.map(k => object.hasOwnProperty(k) && (data[k] = object[k]));
        return data;
    }

    return Array.isArray(data)
        ? data.map(item => parse(item.attributes, items))
        : parse(data, items)
    ;
}

function parseSelectorParams(target) {
    const matches = target.match(/^\w+|[\#\w\_\-]+|[\.\w\_\-]+|\[.*?\]/ig);
    const targets = [];
    const params = {};
    let item;

    if (!matches) {
        return {};
    }

    if (!/[^a-z]/ig.test(matches[0])) {
        params.tagName = matches.shift();
        params.isSingleTag = isSingleTag(params.tagName);
        params.isPairedTag = !params.isSingleTag;
        targets.push(params.tagName);
    }

    while (item = matches.shift()) {
        if (item[0]=='#') {
            params.id = item.substr(1).split('#').pop();
        }
        else if (item[0]=='.') {
            const items = item.substr(1).split('.');
            params.class = params.hasOwnProperty('class') 
                ? params.class.concat(items) 
                : items
            ;
        }
        else if (item[0]=='[') {
            const items = item.substr(1, item.length-2).split('|');
            params.attributes = params.hasOwnProperty('attributes')
                ? params.attributes.concat(items) 
                : items
            ;
        }
    }

    if (params.hasOwnProperty('id')) {
        targets.push('#'+params.id);
    }
    if (params.hasOwnProperty('class')) {
        targets.push('.'+params.class.join('.'));
    }
    if (targets.length) {
        params.target = targets.join('');
    }

    return params;
}

/**
 * isSingleTag
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element
 * @param {String} tagName Tag name
 */
function isSingleTag(tagName) {
    return [
        'area',
        // 'b',
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
        'wbr'
    ].includes(tagName);
}

function getFormChildItems(html) {
    let matches;
    const values = {};

    while (matches = /<\w+\s(?:[^>]*)name=(?:[^>]*)>/im.exec(html)) {
        let last = matches.index + matches[0].length;
        const { name, value } = parseHTML(matches[0], 'attributes');
        name && (values[ name ] = value || '');
        html = html.substr(last);
    }

    return values;
}

function isMatchedAttribute(target, attrs) {
    // let match;

    if (Array.isArray(target) && target.length) {
        let attributeName = 'name';
        const aliases = {
            '#': 'id',
            '.': 'class'
        };

        if (aliases.hasOwnProperty(target[0])) {
            attributeName = aliases[ target[0] ];
            target = target.substr(1);
        }

        if (attrs.hasOwnProperty(attributeName)) {
            return attrs[ attributeName ].includes(target);
            // return target == attrs[ attributeName ];
            // console.log(target, attrs[ attributeName ], attrs, attributeName);
        }
    }

    else {
        let match = true;

        if (target.hasOwnProperty('id')) {
            match = match && attrs.hasOwnProperty('id') && target.id === attrs.id;
        }

        if (target.hasOwnProperty('class')) {
            if (match = match && attrs.hasOwnProperty('class')) {
                target.class.map(cls => match = match && attrs.class.includes(cls));
            }
        }

        // console.log(match?true:false, 'after');
        return match;
    }

    return false;
}

function parseHTML(html, collection=[]) {
    let obj = {};
    let data = {};
    let matches;

    if (matches = /<(\w+)([^>]*)>/.exec(html.replace(/\s+/g, ' ').replace(/\s?\/>/, '>'))) {
        const [ , tag, params ] = matches;
        obj.html = html;
        obj.tag = tag;
        obj.attributes = parseTagAttributes(params);

        if (Array.isArray(collection) && collection.length) {
            collection.map(attr => {
                if (obj.hasOwnProperty(attr)) {
                    data[ attr ] = obj[ attr ];
                }
            });
        }

        else if (typeof(collection) == 'string' && collection.length) {
            if (obj.hasOwnProperty(collection)) {
                data = obj[ collection ];
            }
            else if (obj.attributes.hasOwnProperty(collection)) {
                data = obj.attributes[ collection ];
            }
        }

        else {
            data = obj;
        }
    }

    return data;
}

function parseTagAttributes(textHtml) {
    const attributes = {};
    let matches;
    let last = 0;

    if (!textHtml) {
        return attributes;
    }

    // while (matches = /([\w]+)=["']([^'"]+)['"]/img.exec(textHtml.substr(last))) {
    while (matches = /([\w]+)=["'](.*?)['"]/img.exec(textHtml.substr(last))) {
        // const [html, name, value] = Array.prototype.slice.call(matches);
        const [ html, name, value ] = [ ...matches ];
        last += matches.index + html.length;

        if (name) {
            attributes[ name ] = value;
            // attributes[ name ] = toType(value);
        }
    }

    return attributes;
}

function toType(type) {
    if (type === 'true') {
        return true;
    }

    if (type === 'false') {
        return false;
    }

    if (/^[\d-]+$/.test(type)) {
        return Number.parseInt(type, 10);
    }

    return type;
}

function logTree(tagHtml, tagDefine, depth) {
    const html = tagHtml.replace(/\r|\n/g, '');
    let space, color;

    function paint(color, text) {
        return `\x1B[38;05;${color}m${text}\x1B[0m`;
    }

    if (HtmlParser.TAG_OPENED == tagDefine) {
        space = ' '.repeat((depth-1)*2);
        color = depth + 2;
    } else if (HtmlParser.TAG_CLOSED == tagDefine) {
        space = ' '.repeat(depth*2);
        color = depth + 3;
    }

    // paint(color, space, html)
    console.log('%s %s%s', paint(3, depth), space, paint(color, html));
    depth == 0 && process.stdout.write('\n');
}

module.exports = HtmlParser;
