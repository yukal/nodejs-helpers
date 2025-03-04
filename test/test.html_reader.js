'use strict';

import assert from 'node:assert';
import { describe, it, before, afterEach } from 'node:test';

import path from 'path';
import fs from 'fs/promises';

import HtmlReader from '../src/HtmlReader/index.js';

// ..............................
// Check HtmlReader

describe('Html Reader', () => {
  var parser;

  before(async () => {
    var stubFile = path.join(process.cwd(), './test/data/1.html');
    var content = await fs.readFile(stubFile, 'utf8');

    parser = HtmlReader.from(content);
  });

  afterEach(() => {
    parser.flushResults();
  });

  it('initial state', () => {
    // Instance
    assert.ok(parser instanceof HtmlReader);

    // Variables
    assert.deepEqual(parser._storage, {});
    assert.strictEqual(parser._results, null);
    assert.strictEqual(parser._lastSavedPin, '');
    assert.strictEqual(parser._lastGivenPin, '');
    assert.strictEqual(parser._lastGivenItem, -1);

    // Methods (required)
    assert.ok(parser.findOne instanceof Function);
    assert.ok(parser.findAll instanceof Function);
    assert.ok(parser.getInnerData instanceof Function);
    assert.ok(parser.getOuterData instanceof Function);
    assert.ok(parser.pin instanceof Function);
    assert.ok(parser.pinItems instanceof Function);
    assert.ok(parser.fromPin instanceof Function);
    assert.ok(parser.unpin instanceof Function);
    assert.ok(parser.item instanceof Function);
    assert.ok(parser.data instanceof Function);
    assert.ok(parser.flushResults instanceof Function);
  });

  describe('Interface', () => {
    it('flushResults()', () => {

      parser.flushResults();

      assert.deepEqual(parser._storage, {});
      assert.strictEqual(parser._results, null);
      assert.strictEqual(parser._lastSavedPin, '');
      assert.strictEqual(parser._lastGivenPin, '');
      assert.strictEqual(parser._lastGivenItem, -1);
    });

    it('findOne()', () => {
      parser.findOne('td');

      var { attributes, coords } = parser._results;

      assert.strictEqual(attributes.item, '1');
      assert.strictEqual(coords.length, 4);
    });

    it('findAll()', () => {
      parser.findAll('tr');

      assert.ok(Array.isArray(parser._results));
      assert.ok(parser._results.length > 0);
    });

    it('getInnerData()', () => {
      var data = parser.findOne('td').getInnerData();
      assert.strictEqual(data, 'text1');
    });

    it('getOuterData()', () => {
      var data = parser.findOne('td').getOuterData();
      assert.strictEqual(data, '<td data-item="1">text1</td>');
    });

    it('pin()', () => {
      parser.findOne('td').pin('td');

      var { attributes, coords } = parser._storage.td;

      assert.strictEqual(attributes.item, '1');
      assert.ok(Array.isArray(coords));
      assert.strictEqual(coords.length, 4);
      assert.strictEqual(parser._lastSavedPin, 'td');
    });

    it('pinItems()', () => {
      parser.findAll('tr').pinItems('rows', [1, 2]);

      assert.ok(Array.isArray(parser._storage.rows));
      assert.strictEqual(parser._storage.rows.length, 2);
      assert.strictEqual(parser._lastSavedPin, 'rows');
    });

    it('fromPin()', () => {
      parser.findOne('td').pin('td').fromPin('td');

      assert.strictEqual(parser._lastSavedPin, 'td');
      assert.strictEqual(parser._lastGivenPin, 'td');
    });

    it('unpin()', () => {
      parser.findAll('tr').pinItems('rows', [1, 2]).unpin('rows');
      assert.ok(!parser._storage.hasOwnProperty('rows'));
    });

    it('item()', () => {
      parser.findAll('tr').item(0);

      var { attributes, coords } = parser._results;

      assert.strictEqual(attributes.class, 'row');
      assert.ok(Array.isArray(coords));
      assert.strictEqual(coords.length, 4);
      assert.strictEqual(parser._lastGivenItem, 0);
    });

    it('data()', () => {
      parser.findAll('tr[class]');

      var data = parser.data();
      var expectedLength = parser._results.length;

      assert.ok(Array.isArray(data));
      assert.strictEqual(data.length, expectedLength);
      assert.strictEqual(data[0].class, 'row');
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
