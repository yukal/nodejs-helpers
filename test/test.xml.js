'use strict';

import assert from 'node:assert';
import { describe, it, before } from 'node:test';

import path from 'path';
import fs from 'fs/promises';

import XML from '../src/Xml.js';

// ..............................
// check xml

describe('XML', () => {
  var xml;

  before(async () => {
    var stabFile = path.join(process.cwd(), './test/data/1.xml');      
    var content = await fs.readFile(stabFile, 'utf8');

    xml = XML(content);
  });

  // beforeEach(() => console.log('about to run a test'));

  describe('parsing', () => {
    it('parsed XML should be a filled object', async () => {
      assert.equal(typeof(xml), 'object');
      assert.ok(Object.keys(xml).length > 0);
    });

    it('xml attributes', () => {
      assert.equal(xml['@version'], '1.0');
      assert.equal(xml['@encoding'], 'utf-8');
    });

    it('inner items', () => {
      assert.ok(xml.hasOwnProperty('data'));
      assert.equal(xml.data['empty_string'], '');
      assert.deepEqual(xml.data['empty_object'], {});
      assert.deepEqual(xml.data.array_with_strings, [
        'item1',
        '',
        'item2',
        '',
        'item3'
      ]);

      assert.deepEqual(xml.data.array_with_objects, [{
        'attr1': 'val1',
        'attr2': 'val2',
      },
      {},
      {
        'attr1': 'val1',
        'attr2': 'val2',
      }]);

      assert.equal(xml.data.array_with_objects[0].attrsLength, 2);
      assert.equal(xml.data.array_with_objects[1].attrsLength, 0);
      assert.equal(xml.data.array_with_objects[2].attrsLength, 2);
      assert.equal(xml.data.text, 'text data');

      assert.ok(xml.data.hasOwnProperty('text_with_attributes'));
      assert.deepEqual(xml.data.text_with_attributes, {
        '@id': 'baf9df73',
        '@type': 'txt',
        '&text': 'text data',
      });

      assert.ok(xml.data.hasOwnProperty('complex_object'));
      assert.deepEqual(xml.data.complex_object, {
        array: [
          { 'name': 'item1' },
          { '@name': 'item2', '&text': 'array_item_txt2' },
          'array_item_txt3',
          'array_item_txt4',
        ],
        textualData: 'text data',
        data: { 'attr-key': 'attr-value' },
        link: [
          {
            'href': 'http://domain.com/rss.xml',
            'rel': 'self',
            'type': 'application/rss+xml'
          },
          {
            '@href': 'http://domain.com/bbc.xml',
            '@rel': 'self',
            '@type': 'application/rss+xml',
            '&text': [
              'text-1',
              'text-2',
              'text-3',
              'text-4',
            ],
            span: [
              'span-1',
              'span-2',
            ],
            div: {
              '&text': [
                'text1',
                'text2',
              ],
              div: 'text-div',
            }
          },
          'http://domain.com/sect.php?id=9'
        ],
        '&text': ['text1', 'text2']
      });

    });
  });

  describe('stringify', () => {
    it('empty xml', () => {
      assert.equal(XML.stringify(), '');
    });

    it('empty xml with default params', () => {
      var text = XML.stringify({});
      assert.equal(text, '<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('empty xml with specific params', () => {
      var text = XML.stringify({}, {
        version: '2.0',
        encoding: 'cp1251',
      });

      assert.equal(text, '<?xml version="2.0" encoding="cp1251"?>');
    });

    it('empty string', () => {
      var text = XML.stringifyBody({ data: '' });
      assert.equal(text, '\n<data></data>');
    });

    it('empty object', () => {
      var text = XML.stringifyBody({ data: {} });
      assert.equal(text, '\n<data />');
    });

    it('array with strings', () => {
      var data = ['item1', 'item2', 'item3'];
      var expectingRows = [
        '<data>item1</data>',
        '<data>item2</data>',
        '<data>item3</data>'
      ];

      var text = XML.stringifyBody({ data });
      var result = expectingRows.join('\n');

      assert.equal(text, `\n${result}`);
    });

    it('array with objects', () => {
      var data = [
        {
          '@attr1': 'val1',
          '@attr2': 'val2',
        },
        {},
        {
          tag1: 'val1',
          tag2: 'val2',
        }
      ];

      var expectingRows = [
        '<data attr1="val1" attr2="val2" />',
        '<data />',
        '<data>',
        '  <tag1>val1</tag1>',
        '  <tag2>val2</tag2>',
        '</data>',
      ];

      var text = XML.stringifyBody({ data });
      var result = expectingRows.join('\n');

      assert.equal(text, `\n${result}`);
    });

    it('object with attributes', () => {
      var data = {
        '@name': 'JUPITER',
        '@alias': 'JPTR',
      };

      var text = XML.stringifyBody({ data });
      assert.equal(text, `\n<data name="JUPITER" alias="JPTR" />`);
    });

    it('text', () => {
      var data = 'text data';
      var text = XML.stringifyBody({ data });

      assert.equal(text, `\n<data>text data</data>`);
    });

    it('text with attributes', () => {
      var data = {
        '@id': 'baf9df73',
        '@type': 'txt',
        '&text': 'text data',
      };

      var expectingRows = [
        '<data id="baf9df73" type="txt">',
        '  text data',
        '</data>',
      ];

      var text = XML.stringifyBody({ data });
      var result = expectingRows.join('\n');

      assert.equal(text, `\n${result}`);
    });
  });

});
