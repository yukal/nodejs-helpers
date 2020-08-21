const root = process.cwd();

const Fs = require('fs');
const XML = require(`${root}/lib/xml`);

Fs.promises.readFile(`${root}/test/data/1.xml`, 'utf8')
    .then(content => {
        // To see the tree structure of XML data set "showTree" 
        // parameter to true as second argument.
        // example: XML.parse(content, { showTree: true });

        const xmlData = XML.parse(content);

        // Get attributes from header
        const headerAttributes = XML.getAttributes(xmlData);
        console.log(headerAttributes);

        // Enters inside a nested path and returns the data inside the object.
        // It does not work with arrays
        const entrance = XML.enter(xmlData, 'data object_complex data');
        console.log(entrance);

        const jsonData = JSON.stringify(xmlData, null, 4);
        process.stdout.write(`${jsonData}\n`);
    })
    .catch(console.error)
;
