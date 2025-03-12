import { getStaticMetadata, staticMetadata } from '../StaticMetadataDecorator';

describe('Static Metadata Decorator Tests', () => {
    const MetadataSymbol: unique symbol = Symbol('Metadata');

    it('should throw an error if the target is not a class property', () => {
        expect(() => {
            staticMetadata(MetadataSymbol, () => 'test')(null, 'test');
        }).toThrow(
            'The static metadata decorator can only be used on class properties.',
        );
    });

    it('should create metadata field', () => {
        class TestClass {
            @staticMetadata(MetadataSymbol, () => 'test')
            public testField: string;
        }

        const testInstance = new TestClass();
        expect(getStaticMetadata(testInstance, MetadataSymbol)).toBe('test');
    });

    it('should deliver the property key to the modifierDelegate', () => {
        class TestClass {
            @staticMetadata(
                MetadataSymbol,
                (_, __, pk) => 'test: ' + pk.toString(),
            )
            public testField: string;
        }

        const testInstance = new TestClass();

        expect(getStaticMetadata(testInstance, MetadataSymbol)).toBe(
            'test: testField',
        );
    });

    it('should pass the parent metadata to the modifierDelegate', () => {
        class ParentClass {
            @staticMetadata(MetadataSymbol, () => 'parent')
            public testField: string;
        }

        class TestClass extends ParentClass {
            @staticMetadata(MetadataSymbol, (parent, current) => {
                return `${parent} ${current}`;
            })
            public testField: string;
        }

        const testInstance = new TestClass();

        expect(getStaticMetadata(testInstance, MetadataSymbol)).toBe(
            'parent undefined',
        );
    });

    it('should pass the parent metadata to the modifierDelegate for multiple fields', () => {
        class ParentClass {
            @staticMetadata<string>(MetadataSymbol, () => 'parent')
            public testField: string;
        }

        class TestClass extends ParentClass {
            @staticMetadata<string>(MetadataSymbol, (parent, current) => {
                return `${parent} ${current}`;
            })
            public testField: string;

            @staticMetadata<string>(MetadataSymbol, (parent, current) => {
                return `${parent} ${current}`;
            })
            public testField2: string;
        }

        const testInstance = new TestClass();

        expect(getStaticMetadata(testInstance, MetadataSymbol)).toBe(
            'parent parent undefined',
        );
    });
});
