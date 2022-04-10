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

  describe('serialize', () => {
    it.skip('TODO: check object to XML text conversion', () => { });
  });

});
