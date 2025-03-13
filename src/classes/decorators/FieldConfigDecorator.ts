import PrjBaseData from 'src/models/Data/PrjBaseData';
import { ModifierDelegate, staticMetadata } from './StaticMetadataDecorator';

/**
 * A unique symbol used to mark properties that should be included in the {@link PrjBaseData.mergeData} method.
 */
export const FieldConfigSymbol: unique symbol = Symbol('FieldConfig');

/**
 * Represents a entry in the field configuration.
 */
interface IFieldConfigEntry {
    key: string | number | symbol;
    defaultValue?: unknown;
}

/**
 * A decorator function to mark class properties for inclusion in the {@link PrjBaseData.mergeData} method.
 * @param defaultValue The optional default value for the field. The setter will be used with this value.
 * @returns A decorator function.
 * @remarks - The field must have a getter and setter.
 * - The field must be marked as `@fieldConfig` in the class.
 * - `@fieldConfig` in higher classes will overwrite the default value of the same field in lower classes.
 * - Create a {@link FieldConfigSymbol} property in the class to get the field configurations.
 */
export function fieldConfig(
    defaultValue?: unknown,
): (target: unknown, propertyKey: string | symbol) => void {
    const fieldConfigurator: ModifierDelegate<IFieldConfigEntry[]> = (
        parentFieldConfigs,
        fieldConfigs,
        propertyKey,
    ) => {
        if (fieldConfigs === undefined) {
            fieldConfigs = [];

            // Clone the parent field configurations
            // for inheritance.
            if (parentFieldConfigs) {
                fieldConfigs.push(...parentFieldConfigs);
            }
        }

        // Check if property key is already in the list
        const existingIndex = fieldConfigs.findIndex(
            (config: IFieldConfigEntry) => config.key === propertyKey,
        );

        // If the property key is not in the list, add it.
        if (existingIndex == -1) {
            fieldConfigs.push({
                key: propertyKey,
                defaultValue,
            });
        } else {
            // If the property key is in the list, update it
            // to overwrite the inherited default value.
            fieldConfigs[existingIndex] = {
                key: propertyKey,
                defaultValue,
            };
        }

        return fieldConfigs;
    };

    return staticMetadata(FieldConfigSymbol, fieldConfigurator);
}
