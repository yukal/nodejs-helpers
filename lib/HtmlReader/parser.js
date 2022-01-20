'use strict';

const Tag = require('./Tag');
const Type = require('./Type');

const parseSelectorParams = (target) => {
  const matches = target.match(/^\w+|[\#\w\_\-]+|[\.\w\_\-]+|\[.*?\]/gi);
  const targets = [];
  const params = {};
  let item;

  if (!matches) {
    return {};
  }

  if (!/[^a-z]/ig.test(matches[0])) {
    params.tagName = matches.shift();
    params.isSingleTag = Tag.isSingle(params.tagName);
    params.isPairedTag = !params.isSingleTag;
    targets.push(params.tagName);
  }

  while (item = matches.shift()) {
    if (item[0] == '#') {

      params.id = item.substr(1).split('#').pop();

    } else if (item[0] == '.') {

      const items = item.substr(1).split('.');
      params.class = params.hasOwnProperty('class')
        ? params.class.concat(items)
        : items;

    } else if (item[0] == '[') {

      const items = item.substr(1, item.length - 2).split('|');
      params.attributes = params.hasOwnProperty('attributes')
        ? params.attributes.concat(items)
        : items;

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

const parseTagAttributes = (textHtml) => {
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

const isMatchedAttributes = (target, attrs) => {
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

const getItems = (data, items) => {
  function parse(object, items) {
    const data = {};
    items.map((k) => object.hasOwnProperty(k) && (data[k] = object[k]));
    return data;
  }

  return Array.isArray(data)
    ? data.map((item) => parse(item.attributes, items))
    : parse(data, items);
}

const search = (selector, html, coords, firstMatch = false) => {
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
    tagStart = coords[Tag.POS_CONTNENT_START] || coords[Tag.POS_START];
    tagEnd = coords[Tag.POS_CONTNENT_END] || coords[Tag.POS_END];
  }

  while (
    (matches = new RegExp(template, 'img').exec(
      html.substring(tagStart, tagEnd)
    ))
  ) {
    const [matchRow, tagSign, tagName, tagParams] = [...matches];
    const isSingle = Tag.isSingle(tagName);
    tagStart += matches.index + matchRow.length;

    if (tagSign === Tag.CHR_OPENED) {
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
    } else if (tagSign === Tag.CHR_PAIRED_CLOSED) {
      tagDepth--;
      // logTree(matchRow, tagSign, tagDepth);

      if (!tagsMap.hasOwnProperty(tagDepth)) {
        continue;
      }

      const data = tags[tagsMap[tagDepth]];
      // data.tag.push(matchRow);
      data.coords[Tag.POS_CONTNENT_END] = tagStart - matchRow.length;
      data.coords[Tag.POS_END] = tagStart;

      delete tagsMap[tagDepth];
      tagsMap.length -= 1;

      if (firstMatch && tagsMap.length == 0) {
        return data;
      }
    }
  } // End while

  return firstMatch ? null : tags;
}

module.exports = search;
