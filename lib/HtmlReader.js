/**
 * HtmlReader
 *
 * @file
 * @ingroup Modules
 * @version 1.5 (beta)
 * @license MIT
 * @author Alexander Yukal <yukal@email.ua>
 */

const POS_CONTNENT_START = 0;
const POS_CONTNENT_END = 1;
const POS_TAG_START = 2;
const POS_TAG_END = 3;

const TAG_OPENED = String.fromCharCode(0x3c);
const TAG_CLOSED = '</';
const TAG_ENDED = String.fromCharCode(0x3e);

const Type = (obj) => {
  const signature = Object.prototype.toString.call(obj);
  return signature.slice(8, -1).toLowerCase();
};

Type.isObject = (data) => Type(data) === 'object';
Type.isString = (data) => Type(data) === 'string';

/**
 * findOne
 *
 * Searching the Html tag by a specific path of Html tree.
 * Example: "div#box1 a img", "div.box a img[src|width|height]"
 *
 * Details:
 * If attributes are passed with the last tag in the first argument, the result
 * should return an object with the selected attributes, otherwise, it returns
 * the list of objects.
 * If the second argument passed as Html-text, the search for the necessary tag
 * will be carried out in this text.
 * If the second argument passed as array with coords, the search for the necessary tag
 * will be carried out by relative coordinates of the passed object.
 *
 * @param {String} path A path to an Html tag
 * @param {Array} coords [optional]
 * @returns {Object} Object with chosen attributes
 */
function findOne(path, coords, html = '') {
  let selector = '';
  let pathChunks = path.split(' ');
  const lastSelector = pathChunks.pop();

  if (pathChunks.length) {
    while ((selector = pathChunks.shift())) {
      const data = search(selector, coords, true, html);
      coords = data.coords;
    }
  }

  return search(lastSelector, coords, true, html);
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
 * it returns the list of objects.
 * If the second argument passed as Html-text, the search for the necessary tag
 * will be carried out in this text.
 * If the second argument passed as array with coords, the search for the necessary tag
 * will be carried out by relative coordinates of the passed object.
 *
 * @param {String} path A path to an Html tag
 * @param {Array} coords [optional]
 * @returns {Array} list with objects or list with attributes from searched tags
 */
function findAll(path, coords, html = '') {
  let selector = '';
  let pathChunks = path.split(' ');
  const lastSelector = pathChunks.pop();

  if (pathChunks.length) {
    while ((selector = pathChunks.shift())) {
      const data = search(selector, coords, true, html);
      coords = data.coords;
    }
  }

  return search(lastSelector, coords, false, html);
}

function getFormsData(target) {
  let data = this.html;
  let matches;
  let formData;
  let position = 0;
  let start = -1;
  let end = -1;
  const forms = [];

  while ((matches = /<(\/?form).*?>/im.exec(data))) {
    const [tpl, tag] = [...matches];
    let { index, groups } = matches;

    let last = index + tpl.length;
    position += last;
    data = data.substr(last);

    if (tag == 'form') {
      const attributes = parseHTML(tpl, 'attributes');

      if (target && !isMatchedAttributes(target, attributes)) {
        continue;
      }

      forms.push(attributes);
      formData = forms[forms.length - 1];
      formData.values = {};
      start = position;
    } else if (tag == '/form' && position > start && start > -1) {
      end = position - tpl.length;
      const html = this.html.substring(start, end);
      formData.values = getFormChildItems(html);

      start = -1;
      end = -1;
    }
  }

  return target ? forms.shift() : forms;
}

function findTagSelect(searchParams, html = '') {
  const parentTag = findOne('select', searchParams, html);
  const childrenTags = findAll('option', parentTag, html);

  parentTag.option = {};

  childrenTags.forEach((childrenTag) => {
    parentTag.option[childrenTag.attributes.value] = html.substring(
      childrenTag.coords[POS_CONTNENT_START],
      childrenTag.coords[POS_CONTNENT_END]
    );
  });

  return parentTag;
}

function findTagsSelect(searchParams, html = '') {
  const tags = findAll('select', searchParams, html);

  for (const parentTag of tags) {
    const childrenTags = findAll('option', parentTag, html);
    parentTag.option = {};

    childrenTags.forEach((childrenTag) => {
      parentTag.option[childrenTag.attributes.value] = html.substring(
        childrenTag.coords[POS_CONTNENT_START],
        childrenTag.coords[POS_CONTNENT_END]
      );
    });
  }

  return tags;
}

function search(selector, coords, firstMatch = false, html = '') {
  const tags = [];
  const tagsMap = { length: 0 };
  let tagDepth = 0;
  let tagStart = 0;
  let tagEnd = html.length;
  let matches;

  const target = parseSelectorParams(selector);
  const template = target.hasOwnProperty('tagName')
    ? `(</?)(${target.tagName})([^>]*?)>`
    : `(</?)([a-z]+)([^>]*?)?>`;

  if (Type.isObject(coords) && coords.hasOwnProperty('coords')) {
    coords = coords.coords;
  }

  if (coords?.length) {
    tagStart = coords[POS_CONTNENT_START] || coords[POS_TAG_START];
    tagEnd = coords[POS_CONTNENT_END] || coords[POS_TAG_END];
  }

  while (
    (matches = new RegExp(template, 'img').exec(
      html.substring(tagStart, tagEnd)
    ))
  ) {
    const [matchRow, tagSign, tagName, tagParams] = [...matches];
    const isSingle = isSingleTag(tagName);
    tagStart += matches.index + matchRow.length;

    if (tagSign === TAG_OPENED) {
      !isSingle && tagDepth++;
      // !isSingle && logTree(matchRow, tagSign, tagDepth);

      const attributes = parseTagAttributes(tagParams);
      if (!isMatchedAttributes(target, attributes)) {
        continue;
      }

      if (target.hasOwnProperty('attributes')) {
        if (firstMatch) {
          return getItems(attributes, target.attributes);
        }
        tags.push(getItems(attributes, target.attributes));
        continue;
      }

      // ...............................................................
      const coords = isSingle
        ? [tagStart - matchRow.length, tagStart]
        : [tagStart, 0, tagStart - matchRow.length, 0];

      const data = { attributes, coords };
      // ...............................................................

      // Processing non-paired tags
      if (firstMatch && isSingle && (target.isSingle || tagsMap.length == 0)) {
        // if (target.isSingle || tagsMap.length==0) {
        return data;
        // }
      }

      tags.push(data);

      // Processing paired tags
      if (!isSingle) {
        tagsMap[tagDepth - 1] = tags.length - 1;
        tagsMap.length += 1;
      }
    } else if (tagSign === TAG_CLOSED) {
      tagDepth--;
      // logTree(matchRow, tagSign, tagDepth);

      if (!tagsMap.hasOwnProperty(tagDepth)) {
        continue;
      }

      const data = tags[tagsMap[tagDepth]];
      // data.tag.push(matchRow);
      data.coords[POS_CONTNENT_END] = tagStart - matchRow.length;
      data.coords[POS_TAG_END] = tagStart;

      delete tagsMap[tagDepth];
      tagsMap.length -= 1;

      if (firstMatch && tagsMap.length == 0) {
        return data;
      }
    }
  } // End while

  return firstMatch ? null : tags;
}

function getItems(data, items) {
  function parse(object, items) {
    const data = {};
    items.map((k) => object.hasOwnProperty(k) && (data[k] = object[k]));
    return data;
  }

  return Array.isArray(data)
    ? data.map((item) => parse(item.attributes, items))
    : parse(data, items);
}

function parseSelectorParams(target) {
  const matches = target.match(/^\w+|[\#\w\_\-]+|[\.\w\_\-]+|\[.*?\]/gi);
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
    if (item[0] == '#') {
      params.id = item.substr(1).split('#').pop();
    }
    else if (item[0] == '.') {
      const items = item.substr(1).split('.');
      params.class = params.hasOwnProperty('class')
        ? params.class.concat(items)
        : items
      ;
    }
    else if (item[0] == '[') {
      const items = item.substr(1, item.length - 2).split('|');
      params.attributes = params.hasOwnProperty('attributes')
        ? params.attributes.concat(items)
        : items
      ;
    }
  }

  if (params.hasOwnProperty('id')) {
    targets.push('#' + params.id);
  }
  if (params.hasOwnProperty('class')) {
    targets.push('.' + params.class.join('.'));
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
  ].includes(tagName);
}

function getFormChildItems(html) {
  let matches;
  const values = {};

  while (matches = /<\w+\s(?:[^>]*)name=(?:[^>]*)>/im.exec(html)) {
    let last = matches.index + matches[0].length;
    const { name, value } = parseHTML(matches[0], 'attributes');
    name && (values[name] = value || '');
    html = html.substr(last);
  }

  return values;
}

function isMatchedAttributes(target, attrs) {
  if (Array.isArray(target) && target.length) {
    let attributeName = 'name';
    const aliases = {
      '#': 'id',
      '.': 'class',
    };

    if (aliases.hasOwnProperty(target[0])) {
      attributeName = aliases[target[0]];
      target = target.substr(1);
    }

    if (attrs.hasOwnProperty(attributeName)) {
      return attrs[attributeName].includes(target);
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
        target.class.map((cls) => (match = match && attrs.class.includes(cls)));
      }
    }

    // console.log(match?true:false, 'after');
    return match;
  }

  return false;
}

function parseHTML(html, collection = []) {
  let obj = {};
  let data = {};
  let matches;

  if (
    (matches = /<(\w+)([^>]*)>/.exec(
      html.replace(/\s+/g, ' ').replace(/\s?\/>/, '>')
    ))
  ) {
    const [, tag, params] = matches;
    obj.html = html;
    obj.tag = tag;
    obj.attributes = parseTagAttributes(params);

    if (Array.isArray(collection) && collection.length) {
      collection.map((attr) => {
        if (obj.hasOwnProperty(attr)) {
          data[attr] = obj[attr];
        }
      });
    }

    else if (Type.isString(collection) && collection.length) {
      if (obj.hasOwnProperty(collection)) {
        data = obj[collection];
      }
      else if (obj.attributes.hasOwnProperty(collection)) {
        data = obj.attributes[collection];
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
    const [html, name, value] = [...matches];
    last += matches.index + html.length;

    if (name) {
      attributes[name] = value;
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

  if (TAG_OPENED == tagDefine) {
    space = ' '.repeat((depth - 1) * 2);
    color = depth + 2;
  } else if (TAG_CLOSED == tagDefine) {
    space = ' '.repeat(depth * 2);
    color = depth + 3;
  }

  // paint(color, space, html)
  console.log('%s %s%s', paint(3, depth), space, paint(color, html));
  depth == 0 && process.stdout.write('\n');
}

function getTextFrom(coords, html = '') {
  let posStart = 0;
  let posEnd = 0;

  // console.log('getTextFrom', coords);

  if (Type.isObject(coords) && coords.hasOwnProperty('coords')) {
    coords = coords.coords;
  }

  if (coords?.length) {
    posStart = coords[POS_CONTNENT_START] || 0;
    posEnd = coords[POS_CONTNENT_END] || 0;
  }

  // console.log('getTextFrom', posStart, posEnd);
  return html.slice(posStart, posEnd);
}

function getHtmlFrom(coords, html = '') {
  let posStart = 0;
  let posEnd = 0;

  if (Type.isObject(coords) && coords.hasOwnProperty('coords')) {
    coords = coords.coords;
  }

  if (coords?.length) {
    posStart = coords[POS_TAG_START];
    posEnd = coords[POS_TAG_END];
  }

  return html.slice(posStart, posEnd);
}

const getItem = (ctx, index = -1) => {
  const storageEntry = ctx._lastGivenPin
    ? ctx._lastGivenPin
    : ctx._lastSavedPin;

  const savedData = storageEntry ? ctx._storage[storageEntry] : ctx._results;

  const indexNum = index > -1 ? index : ctx._lastGivenItem;

  // console.log(storageEntry);
  // console.log(savedData);

  if (Array.isArray(savedData)) {
    // console.log('ARRAY');
    return savedData[indexNum];
  }

  // if (!Array.isArray(savedData)) {
  //   console.log('NOT ARRAY');
  //   // return savedData;
  // }

  // if (index > -1) {
  //   console.log('ARRAY', index, savedData[index]);
  //   return savedData[index];
  // }

  return savedData;

  // const results = !Array.isArray(savedData) ? savedData : {};
  // return getHtmlFrom(results, ctx._html);
};

const getCoords = (searchResults) => {
  let coords = [];

  if (Type.isObject(searchResults) && searchResults.hasOwnProperty('coords')) {
    coords = searchResults.coords;
  }

  return coords;
};

class HtmlReader {
  static from(html) {
    return new HtmlReader(html);
  }

  constructor(html) {
    this._html = html;

    this._storage = {};
    this._results = null;

    this._lastSavedPin = '';
    this._lastGivenPin = '';
    this._lastGivenItem = -1;
  }

  findOne(target) {
    const results = getItem(this);

    this.clearMarkers();
    this._results = findOne(target, results, this._html);

    return this;
  }

  findAll(target) {
    const results = getItem(this);

    this.clearMarkers();
    this._results = findAll(target, results, this._html);

    return this;
  }

  getFormsData(target) {
    getFormsData(target, this._html);
    return this;
  }

  findTagSelect(params) {
    findTagSelect(params, this._html);
    return this;
  }

  findTagsSelect(params) {
    findTagsSelect(params, this._html);
    return this;
  }

  getInnerData(from) {
    // const storageEntry = this._lastGivenPin
    //   ? this._lastGivenPin
    //   : this._lastSavedPin;

    // const savedData = storageEntry
    //   ? this._storage[storageEntry]
    //   : this._results;

    // const results = !Array.isArray(savedData) ? savedData : {};

    if (from) {
      this.fromPin(from);
    }

    const results = getItem(this);
    return getTextFrom(results, this._html);
  }

  getOuterData(from) {
    // const storageEntry = this._lastGivenPin
    //   ? this._lastGivenPin
    //   : this._lastSavedPin;

    // const savedData = storageEntry
    //   ? this._storage[storageEntry]
    //   : this._results;

    // const results = !Array.isArray(savedData) ? savedData : {};

    if (from) {
      this.fromPin(from);
    }

    const results = getItem(this);
    return getHtmlFrom(results, this._html);
  }

  pinItems(name, items = []) {
    this._lastSavedPin = name;
    this._storage[name] = items.map((num) => this._results[num]);

    return this;
  }

  pin(name, index = -1) {
    const results = index > -1 ? this._results[index] : this._results;
    this._storage[name] = results;
    this._lastSavedPin = name;

    return this;
  }

  unpin(name) {
    if (this._storage.hasOwnProperty(name)) {
      delete this._storage[name];
    }

    return this;
  }

  fromPin(name) {
    // const { _lastSavedPin, _lastGivenPin } = this;
    this._lastGivenPin = name;

    // console.log(this._results);
    // console.log(this._storage[name]);
    // console.log(name, this._lastSavedPin, this._lastGivenPin);

    if (name !== this._lastSavedPin || !this._results) {
      // this._results = this._storage[name];
      this._results = getItem(this);
    }
    // console.log('FROM_PIN', this._results);

    return this;
  }

  item(index) {
    this._lastGivenItem = index;
    // const storageEntry = this._lastGivenPin
    //   ? this._lastGivenPin
    //   : this._lastSavedPin;

    // const savedData = storageEntry
    //   ? this._storage[storageEntry]
    //   : this._results;

    // this._results = Array.isArray(savedData) ? savedData[index] : savedData;

    this._results = getItem(this, index);
    return this;
  }

  data(from) {
    const alternativeEntryName = this._lastGivenPin
      ? this._lastGivenPin
      : this._lastSavedPin;

    const entryName = from ? from : alternativeEntryName;
    const storageData = this._storage[entryName];

    if (Array.isArray(storageData)) {
      return [...storageData];
    }

    if (Type.isObject(storageData)) {
      return { ...storageData };
    }

    return storageData;
  }

  clearMarkers() {
    this._lastSavedPin = '';
    this._lastGivenPin = '';
    this._lastGivenItem = -1;

    return this;
  }

  flushResults() {
    this._storage = {};
    this._results = null;
    this.clearMarkers();

    return this;
  }

  dump() {
    const { _html, ...data } = this;
    console.log(data);
    return this;
  }
}

module.exports = HtmlReader;
