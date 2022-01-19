const XML = require('../lib/xml');
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

describe('xml parsing', () => {
    let xml1;

    it('parsed XML should be an object', () => {
        xml1 = XML.parse(checkData.xmlContent);
        expect(xml1).an('object').not.empty;
    });

    describe('general', () => {
        it('root element', () => {
            expect(xml1).property('data');
        });

        it('cleaned up after parsing', () => {
            expect(xml1.data).not.to.have.property(XML._POCKET_NAME);
        });

        it('header with attributes', () => {
            expect(xml1).property('@version', '1.0');
            expect(xml1).property('@encoding', 'UTF-8');
        });
    });

    // ..............
    // Empties

    describe('empties', () => {
        it('nullable data', () => {
            expect(xml1.data).property('nullable', null);
        });

        it('empty object (single tag)', () => {
            expect(xml1.data).property('empty_object_single').eql({});
        });

        it('empty object (paired tag)', () => {
            expect(xml1.data).property('empty_object_paired', null);
        });

        it('array with empty items', () => {
            expect(xml1.data).property('empty_items_array').eql([null, null]);
        });

        it('array with empty objects', () => {
            expect(xml1.data).property('empty_objects_array').eql([{}, {}]);
        });
    });

    // ..............
    // Arrays

    describe('arrays', () => {
        it('array with filled items', () => {
            expect(xml1.data).property('array').eql([
                "item1",
                "item2",
                "item3",
            ]);
        });

        it('array with filled objects', () => {
            expect(xml1.data).property('array_of_objects').eql([
                {
                    "attr1": "val",
                    "attr2": "val"
                },
                {
                    "attr1": "val",
                    "attr2": "val"
                },
                {
                    "attr1": "val",
                    "attr2": "val"
                }
            ]);
        });
    });

    // ..............
    // Objects

    describe('objects', () => {
        it('object with filled attributes', () => {
            expect(xml1.data).property('object').eql({
                "name": "AGENT_JUPITER",
                "qmgr": "QM_JUPITER"
            });
        });

        it('object with complex attributes', () => {
            expect(xml1.data).property('object_complex').eql({
                "array": [
                    {
                        "name": "item1"
                    },
                    {
                        "@name": "item2",
                        "data": "item2"
                    },
                    "item3",
                    "item4"
                ],
                "some": "some",
                "data": {
                    "some": "data"
                }
            });
        });

        it('object with text and array', () => {
            expect(xml1.data).property('object_with_text1').eql({
                "array": [
                    "item1",
                    "item2",
                    "item3"
                ],
                "_innerText": "text <array>item1</array> text <array>item2</array> text <array>item3</array> text",
                "_outerText": "<object_with_text1>\n        text <array>item1</array> text <array>item2</array> text <array>item3</array> text\n    </object_with_text1>"
            });
        });

        it('object with text and attributes', () => {
            expect(xml1.data).property('object_with_text2').eql({
                "item1": "item1",
                "item2": "item2",
                "item3": "item3",
                "_innerText": "text <item1>item1</item1> text <item2>item2</item2> text <item3>item3</item3> text",
                "_outerText": "<object_with_text2>\n        text <item1>item1</item1> text <item2>item2</item2> text <item3>item3</item3> text\n    </object_with_text2>"
            });
        });
    });

    // ..............
    // Texts

    describe('texts', () => {
        it('text data', () => {
            expect(xml1.data).property('text', 'text data');
        });

        it('text with attributes', () => {
            expect(xml1.data).property('text_with_attributes').eql({
                "@id": "baf9df73",
                "@type": "txt",
                "data": "text data"
            });
        });
    });

});
