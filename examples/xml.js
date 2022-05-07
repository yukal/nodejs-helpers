'use strict';

const Fs = require('fs');
const XML = require('../src/Xml');

const parseXML = (content) => {
  try {

    const xmlData = XML.parse(content);

    const jsonData = JSON.stringify(xmlData, null, 2);
    process.stdout.write(`${jsonData}\n`);

    // Fetch attributes from a specific node entry
    // const headerAttributes = XML.fetchAttributes(xmlData);
    // console.log(headerAttributes);

  } catch (error) {

    console.error(error);

  }
};

const strigifyXML = () => {
  const object = {
    '@version': '2.0',
    '@encoding': 'utf-8',
    data: {
      empty_string: '',
      empty_object: {},
      array: {
        items: [
          'item1',
          '',
          'item2',
          '',
          'item3',
        ],
      },

      object_single: {
        '@name': 'JUPITER',
        '@alias': 'JPTR',
      },

      complex_array: [
        {
          item1: {
            '@attr': 'val1',
            item2: {
              '@attr1': 'val1',
              '@attr2': 'val2',
            },
          },
          array: [
            { '@attr1': 'val1' },
            { '@attr2': 'val2', '&text': 'asdf' },
            { '&text': 'asdf' }
          ],
        },
        {},
        {
          attr1: 'val1',
          attr2: 'val2',
        }
      ],

      complex_object: {
        '@key1': 'val1',
        '@key2': 'val2',
        array: [
          {
            tag: 'text_1',
          },
          {
            '@name': 'item2',
            '&text': 'text_2',
          },
          'text_3',
          'text_4',
        ],
        textualData: 'text data',
        data: {
          '@attr-key': 'attr-value',
        },
        link: [
          {
            '@href': 'http://domain.com/rss.xml',
            '@rel': 'self',
            '@type': 'application/rss+xml',
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
          'http://domain.com/sect.php?id=9',
        ],
        '&text': [
          'text1',
          'text2',
        ]
      }

      // end: complex object
    }
  };

  const text = XML.stringify(object);
  process.stdout.write(`${text}\n`);
};

async function main() {
  const content = await Fs.promises.readFile('../test/data/1.xml', 'utf8');

  parseXML(content);
  strigifyXML();
}

main();
