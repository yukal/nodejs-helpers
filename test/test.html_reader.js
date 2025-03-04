'use strict';

import assert from 'node:assert';
import { describe, it, before, afterEach } from 'node:test';

import path from 'path';
import fs from 'fs/promises';

import HtmlReader from '../src/HtmlReader/index.js';

before(async () => {
  const Fs = require('fs');
  const Path = require('path');

  const PATH_DATA = Path.join(process.cwd(), './test/data');
  const htmlFilePath = Path.join(PATH_DATA, '1.html');

  checkData.htmlContent = await Fs.promises.readFile(htmlFilePath, 'utf8');
});

// ..............................
// Check HtmlReader

describe('Html Reader', () => {
  let parser;

  before(() => {
    parser = HtmlReader.from(checkData.htmlContent);
  });

  afterEach(() => {
    parser.flushResults();
  });

  it('initial state', () => {
    // Instance
    expect(parser).instanceOf(HtmlReader);

    // Variables
    expect(parser).property('_storage').eql({});
    expect(parser).property('_results', null);
    expect(parser).property('_lastSavedPin', '');
    expect(parser).property('_lastGivenPin', '');
    expect(parser).property('_lastGivenItem', -1);

    // Methods (required)
    expect(parser).property('findOne').instanceOf(Function);
    expect(parser).property('findAll').instanceOf(Function);
    expect(parser).property('getInnerData').instanceOf(Function);
    expect(parser).property('getOuterData').instanceOf(Function);
    expect(parser).property('pin').instanceOf(Function);
    expect(parser).property('pinItems').instanceOf(Function);
    expect(parser).property('fromPin').instanceOf(Function);
    expect(parser).property('unpin').instanceOf(Function);
    expect(parser).property('item').instanceOf(Function);
    expect(parser).property('data').instanceOf(Function);
    expect(parser).property('flushResults').instanceOf(Function);
  });

  describe('Interface', () => {
    it('flushResults()', () => {
      this._storage = undefined;
      this._results = undefined;
      this._lastSavedPin = undefined;
      this._lastGivenPin = undefined;
      this._lastGivenItem = undefined;

      parser.flushResults();

      expect(parser).property('_storage').eql({});
      expect(parser).property('_results', null);
      expect(parser).property('_lastSavedPin', '');
      expect(parser).property('_lastGivenPin', '');
      expect(parser).property('_lastGivenItem', -1);
    });

    it('findOne()', () => {
      parser.findOne('td');

      const { attributes, coords } = parser._results;

      expect(attributes).property('item', '1');
      expect(coords).an('array').lengthOf(4);
    });

    it('findAll()', () => {
      parser.findAll('tr');
      expect(parser._results).an('array');
      expect(parser._results.length).greaterThan(0);
    });

    it('getInnerData()', () => {
      const data = parser.findOne('td').getInnerData();
      expect(data).equal('text1');
    });

    it('getOuterData()', () => {
      const data = parser.findOne('td').getOuterData();
      expect(data).equal('<td data-item="1">text1</td>');
    });

    it('pin()', () => {
      parser.findOne('td').pin('td');

      const { attributes, coords } = parser._storage.td;

      expect(attributes).property('item', '1');
      expect(coords).an('array').lengthOf(4);
      expect(parser._lastSavedPin).equal('td');
    });

    it('pinItems()', () => {
      parser.findAll('tr').pinItems('rows', [1, 2]);
      expect(parser._storage).property('rows').lengthOf(2);
      expect(parser._lastSavedPin).equal('rows');
    });

    it('fromPin()', () => {
      parser.findOne('td').pin('td').fromPin('td');
      expect(parser._lastSavedPin).equal('td');
      expect(parser._lastGivenPin).equal('td');
    });

    it('unpin()', () => {
      parser.findAll('tr').pinItems('rows', [1, 2]).unpin('rows');
      expect(parser._storage).not.have.property('rows');
    });

    it('item()', () => {
      parser.findAll('tr').item(0);

      // expect(parser._results).an('object');
      const { attributes, coords } = parser._results;

      expect(attributes).property('class', 'row');
      expect(coords).an('array').lengthOf(4);
      expect(parser._lastGivenItem).equal(0);
    });

    it('data()', () => {
      parser.findAll('tr[class]');

      const data = parser.data();
      const expectedLength = parser._results.length;

      expect(data).an('array').lengthOf(expectedLength);
      expect(data[0]).an('object').property('class', 'row');
    });
  });

  describe('TODO: Object State', () => {
    // TODO: all search cases

    // // _results = ...
    // parser.findAll("html body table")
    // // _storage[ mainTable ] = _results
    //   .pin("mainTable")
    // // _results = _results[ 1 ]
    // // _results = _storage[ _lastGivenPin ][ 1 ]
    //   .item(1);

    // // _lastGivenPin = mainTable
    // // _results = _storage[ _lastGivenPin ]
    // parser.fromPin("mainTable")
    // // _results = _storage[ _lastGivenPin ][ 1 ]
    //   .item(1)
    // // _storage[ #id2 ] = _results
    //   .pin("id2")
    // // _results = _storage[ _lastGivenPin ][ 1 ]
    //   .item(1)

    it.skip('tests', () => {})
  });

  describe('TODO: Complex HTML', () => {
    // TODO: all search cases
    it.skip('tests', () => {})
  });
});
