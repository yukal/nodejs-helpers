'use strict';

const Fs = require('fs');
const XML = require('../src/Xml');

Fs.promises.readFile('../test/data/1.xml', 'utf8')
  .then(content => {
    const xmlData = XML.parse(content);

    const jsonData = JSON.stringify(xmlData, null, 4);
    process.stdout.write(`${jsonData}\n`);

    // Fetch attributes from a specific node entry
    const headerAttributes = XML.fetchAttributes(xmlData);
    console.log(headerAttributes);
  })
  .catch(console.error);
