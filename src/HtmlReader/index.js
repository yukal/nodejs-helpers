'use strict';

/**
 * HtmlReader
 *
 * @file
 * @ingroup Modules
 * @version 1.6 (beta)
 * @license MIT
 * @author Alexander Yukal <yukal@email.ua>
 */

const Tag = require('./Tag');
const Type = require('./Type');
const search = require('./parser');

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

  /**
   * findOne
   *
   * Searches for a specific tag in the specified path of the HTML text.
   * Example: "div#box1 a img", "div.box a img[src|width|height]"
   *
   * @see findAll
   * @see search
   *
   * @param {String} target A path to an Html tag
   * @returns {Object} Object with attributes
   */
  findOne(target) {
    let lastResults = getItem(this);

    this.clearMarkers();

    let pathChunks = target.split(' ');
    const lastSelector = pathChunks.pop();

    while (pathChunks.length) {
      const selector = pathChunks.shift();
      lastResults = search(selector, this._html, lastResults, true);
    }

    this._results = search(lastSelector, this._html, lastResults, true);

    return this;
  }

  /**
   * findAll
   *
   * Searches for each specific tag in the specified path of the HTML text.
   * Example: "div#box1 a img", "div.box a img[src|width|height]"
   *
   * @see findOne
   * @see search
   *
   * @param {String} target A path to an Html tag
   * @returns {Array} list with objects or list with attributes from searched tags
   */
  findAll(target) {
    let lastResults = getItem(this);

    this.clearMarkers();

    let pathChunks = target.split(' ');
    const lastSelector = pathChunks.pop();

    while (pathChunks.length) {
      const selector = pathChunks.shift();
      lastResults = search(selector, this._html, lastResults, true);
    }

    this._results = search(lastSelector, this._html, lastResults, false);

    return this;
  }

  // getFormsData(target) {
  //   getFormsData(target, this._html);
  //   return this;
  // }

  // findTagSelect(params) {
  //   findTagSelect(params, this._html);
  //   return this;
  // }

  // findTagsSelect(params) {
  //   findTagsSelect(params, this._html);
  //   return this;
  // }

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

    const { coords } = getItem(this);
    const isValidCoords = Array.isArray(coords);

    const posStart = isValidCoords ? coords[Tag.POS_CONTNENT_START] : 0;
    const posEnd = isValidCoords ? coords[Tag.POS_CONTNENT_END] : 0;

    return this._html.slice(posStart, posEnd);
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

    const { coords } = getItem(this);
    const isValidCoords = Array.isArray(coords);

    const posStart = isValidCoords ? coords[Tag.POS_START] : 0;
    const posEnd = isValidCoords ? coords[Tag.POS_END] : 0;

    return this._html.slice(posStart, posEnd);
  }

  pinItems(name, items = []) {
    this._lastSavedPin = name;

    this._storage[name] = items.length
      ? items.map((num) => this._results[num])
      : this._results;

    return this;
  }

  pin(name, index = -1) {
    const results = index > -1 
      ? this._results[index] 
      : this._results;

    this._storage[name] = results;
    this._lastSavedPin = name;

    return this;
  }

  unpin(name) {
    if (this._storage.hasOwnProperty(name)) {
      if (name === this._lastSavedPin) {
        this._lastSavedPin = '';
      }

      if (name === this._lastGivenPin) {
        this._lastGivenPin = '';

        if (Array.isArray(this._storage[name])) {
          this._lastGivenItem = -1;
        }
      }

      delete this._storage[name];
    }

    return this;
  }

  fromPin(name) {
    // const { _lastSavedPin, _lastGivenPin } = this;
    this._lastGivenPin = name;

    if (name !== this._lastSavedPin || !this._results) {
      // this._results = this._storage[name];
      this._results = getItem(this);
    }

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

    return this._results;
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
