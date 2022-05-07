'use strict';

const XML = require('../src/Xml');
const checkData = {};

before(async () => {
  const Fs = require('fs');
  const Path = require('path');

  const PATH_DATA = Path.join(process.cwd(), './test/data');
  const xmlFilePath = Path.join(PATH_DATA, '1.xml');

  checkData.xmlContent = await Fs.promises.readFile(xmlFilePath, 'utf8');
});

// ..............................
// check xml

describe('XML', () => {
  let xml;

  describe('parsing', () => {
    it('parsed XML should be a filled object', () => {
      xml = XML(checkData.xmlContent);
      expect(xml).an('object').not.empty;
    });

    it('xml attributes', () => {
      expect(xml).property('@version', '1.0');
      expect(xml).property('@encoding', 'utf-8');
    });

    it('inner items', () => {
      expect(xml).property('data');
      expect(xml.data).property('empty_string', '');
      expect(xml.data).property('empty_object').eql({});

      expect(xml.data.array_with_strings).eql([
        'item1',
        '',
        'item2',
        '',
        'item3'
      ]);

      expect(xml.data).property('empty_object');
      expect(xml.data.empty_object)
        .an('object')
        .empty;

      expect(xml.data.array_with_objects).eql([{
        'attr1': 'val1',
        'attr2': 'val2',
      },
      {},
      {
        'attr1': 'val1',
        'attr2': 'val2',
      }]);
      expect(xml.data.array_with_objects[0]).property('attrsLength', 2);
      expect(xml.data.array_with_objects[1]).property('attrsLength', 0);
      expect(xml.data.array_with_objects[2]).property('attrsLength', 2);

      expect(xml.data).property('text', 'text data');

      expect(xml.data).property('text_with_attributes');
      expect(xml.data.text_with_attributes).eql({
        '@id': 'baf9df73',
        '@type': 'txt',
        '&text': 'text data',
      });

      expect(xml.data).property('complex_object');
      expect(xml.data.complex_object).eql({
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
      const text = XML.stringify();
      expect(text).eq('');
    });

    it('empty xml with default params', () => {
      const text = XML.stringify({});
      expect(text).eq('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('empty xml with specific params', () => {
      const text = XML.stringify({}, {
        version: '2.0',
        encoding: 'cp1251',
      });

      expect(text).eq('<?xml version="2.0" encoding="cp1251"?>');
    });

    it('empty string', () => {
      const text = XML.stringifyBody({ data: '' });
      expect(text).eq('\n<data></data>');
    });

    it('empty object', () => {
      const text = XML.stringifyBody({ data: {} });
      expect(text).eq('\n<data />');
    });

    it('array with strings', () => {
      const data = ['item1', 'item2', 'item3'];
      const expectingRows = [
        '<data>item1</data>',
        '<data>item2</data>',
        '<data>item3</data>'
      ];

      const text = XML.stringifyBody({ data });
      const result = expectingRows.join('\n');

      expect(text).eq(`\n${result}`);
    });

    it('array with objects', () => {
      const data = [
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

      const expectingRows = [
        '<data attr1="val1" attr2="val2" />',
        '<data />',
        '<data>',
        '  <tag1>val1</tag1>',
        '  <tag2>val2</tag2>',
        '</data>',
      ];

      const text = XML.stringifyBody({ data });
      const result = expectingRows.join('\n');

      expect(text).eq(`\n${result}`);
    });

    it('object with attributes', () => {
      const data = {
        '@name': 'JUPITER',
        '@alias': 'JPTR',
      };

      const text = XML.stringifyBody({ data });
      expect(text).eq(`\n<data name="JUPITER" alias="JPTR" />`);
    });

    it('text', () => {
      const data = 'text data';
      const text = XML.stringifyBody({ data });
      expect(text).eq(`\n<data>text data</data>`);
    });

    it('text with attributes', () => {
      const data = {
        '@id': 'baf9df73',
        '@type': 'txt',
        '&text': 'text data',
      };

      const expectingRows = [
        '<data id="baf9df73" type="txt">',
        '  text data',
        '</data>',
      ];

      const text = XML.stringifyBody({ data });
      const result = expectingRows.join('\n');

      expect(text).eq(`\n${result}`);
    });
  });

});
