const Fs = require('fs');
const XML = require('../lib/xml');
const check = {};

beforeAll(async () => {
    const dataPath = process.cwd() + '/test/data';
    check.xml1 = XML.parse(
        await Fs.promises.readFile(`${dataPath}/1.xml`, 'utf8')
    );
});

// ..............................
// check xml

describe('xml parsing', () => {
    // const data = XML.parse(check.xml1);

    describe('general', () => {
        test('root element', () => {
            expect(check.xml1).toHaveProperty('data');
        });

        test('cleaned up after parsing', () => {
            expect(check.xml1.data).not.toHaveProperty('*pocket*');
        });

        test('header with attributes', () => {
            expect(check.xml1).toHaveProperty('@version', '1.0');
            expect(check.xml1).toHaveProperty('@encoding', 'UTF-8');
        });
    });

    // ..............
    // Empties

    describe('empties', () => {
        test('nullable data', () => {
            expect(check.xml1.data).toHaveProperty('nullable', null);
        });

        test('empty object (single tag)', () => {
            expect(check.xml1.data).toHaveProperty('empty_object_single', {});
        });

        test('empty object (paired tag)', () => {
            expect(check.xml1.data).toHaveProperty('empty_object_paired', null);
        });

        test('array with empty items', () => {
            expect(check.xml1.data).toHaveProperty('empty_items_array', [null, null]);
        });

        test('array with empty objects', () => {
            expect(check.xml1.data).toHaveProperty('empty_objects_array', [{}, {}]);
        });
    });

    // ..............
    // Arrays

    describe('arrays', () => {
        test('array with filled items', () => {
            expect(check.xml1.data).toHaveProperty('array', [
                "item1",
                "item2",
                "item3",
            ]);
        });

        test('array with filled objects', () => {
            expect(check.xml1.data).toHaveProperty('array_of_objects', [
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
        test('object with filled attributes', () => {
            expect(check.xml1.data).toHaveProperty('object', {
                "name": "AGENT_JUPITER",
                "qmgr": "QM_JUPITER"
            });
        });

        test('object with complex attributes', () => {
            expect(check.xml1.data).toHaveProperty('object_complex', {
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

        test('object with text and array', () => {
            expect(check.xml1.data).toHaveProperty('object_with_text1', {
                "array": [
                    "item1",
                    "item2",
                    "item3"
                ],
                "_innerText": "text <array>item1</array> text <array>item2</array> text <array>item3</array> text",
                "_outerText": "<object_with_text1>\n        text <array>item1</array> text <array>item2</array> text <array>item3</array> text\n    </object_with_text1>"
            });
        });

        test('object with text and attributes', () => {
            expect(check.xml1.data).toHaveProperty('object_with_text2', {
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
        test('text data', () => {
            expect(check.xml1.data).toHaveProperty('text', 'text data');
        });

        test('text with attributes', () => {
            expect(check.xml1.data).toHaveProperty('text_with_attributes', {
                "@id": "baf9df73",
                "@type": "txt",
                "data": "text data"
            });
        });
    });

});
