import PrjBaseData from 'src/models/Data/PrjBaseData';
import { ModifierDelegate, staticMetadata } from './StaticMetadataDecorator';

/**
 * A unique symbol used to mark properties that should be included in the {@link PrjBaseData.toString} method.
 */
export const ToStringFieldSymbol: unique symbol = Symbol('ToStringField');

/**
 * A decorator function to mark class properties for inclusion in the toString output.
 * @param target The target object (the class prototype).
 * @param propertyKey The key of the property being decorated.
 * @remarks - Create a {@link ToStringFieldSymbol} property in the class to get the field configurations.
 */
export function toStringField(
    target: unknown,
    propertyKey: string | symbol,
): void {
    const toStringFieldConfigurator: ModifierDelegate<string[]> = (
        parentToStringFields,
        toStringFields,
        propertyKey,
    ) => {
        if (toStringFields === undefined) toStringFields = [];

        toStringFields.push(propertyKey.toString());

        return toStringFields;
    };

    staticMetadata(ToStringFieldSymbol, toStringFieldConfigurator)(
        target,
        propertyKey,
    );
}
