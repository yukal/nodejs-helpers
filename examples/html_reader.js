const HtmlReader = require('../lib/HtmlReader');

const parseSpecificHtmlPage = (content) => {
  const reader = HtmlReader.from(content);

  reader
    // Find all the tags <table>
    .findAll('table')

    // Save finded data to a dictionary {tables[]}
    // It will save only 4th and 5th items
    .pinItems('tables', [4, 5])

    // Chose saved data from a dictionary: {tables[], , ...}
    .fromPin('tables')

    // Take first element from an array
    .item(0)

    // Find all the tags <tr> inside tables[ 0:tr[], 1:tr[] ]
    .findAll('tr')

    // Save only first 3 items
    .pinItems('rows', [0, 1, 2])

    .fromPin('tables').item(1)

    // Find all images with class name "image_galary"
    // and return only values with "src" attribute
    .findAll('img.image_galary[src]')
    .pin('images')

    // Remove data from the dictionary
    .unpin('tables')

    // See object state in a console
    .dump()

    .fromPin('rows').item(0).findOne('h1').pin('title')
    .fromPin('rows').item(1).findOne('#info').pin('info')
    .fromPin('rows').item(2).findOne('#data').pin('data')
    .unpin('rows')

    // See object state in a console
    .dump()

    .fromPin('data').findOne('#contacts').pin('contacts')
  ;

  const title = reader.getInnerData('title');
  const info = reader.getInnerData('info');
  const contacts = reader.getInnerData('contacts');
  const images = reader.data('images');

  // Clean up
  reader.flushResults();

  return {
    title,
    info,
    contacts,
    images,
  };
};

parseSpecificHtmlPage(htmlContent);
