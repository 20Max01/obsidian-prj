interface IStaticMetadataField_<T> {
    [key: PropertyKey]: T;
}

function isIStaticMetadataField_<T>(
    obj: unknown,
): obj is IStaticMetadataField_<T> {
    return obj != null && typeof obj === 'function';
}

/**
 * A delegate to modify the shadow field.
 * @param parentShadowField The shadow field of the parent class.
 * @param shadowField The shadow field of the current class.
 * @returns The modified shadow field.
 */
export type ModifierDelegate<T> = (
    parentShadowField: T | undefined,
    shadowField: T | undefined,
    propertyKey: PropertyKey,
) => T;

/**
 * A decorator function to add a static metadata field to a class.
 * @param shadowFieldKey The key of the shadow field.
 * @param modifierDelegate The delegate to modify the shadow field.
 * @returns A decorator function.
 */
export function staticMetadata<T>(
    shadowFieldKey: PropertyKey,
    modifierDelegate: ModifierDelegate<T>,
) {
    return function (target: unknown, propertyKey: string | symbol): void {
        if (!target || !isIStaticMetadataField_<T>(target.constructor)) {
            throw new Error(
                'The static metadata decorator can only be used on class properties.',
            );
        }
        const parent = Object.getPrototypeOf(target.constructor);

        const parentShadowField =
            parent && isIStaticMetadataField_<T>(parent)
                ? Object.getOwnPropertyDescriptor(parent, shadowFieldKey)?.value
                : undefined;

        const targetShadowField = Object.getOwnPropertyDescriptor(
            target.constructor,
            shadowFieldKey,
        );

        target.constructor[shadowFieldKey] = modifierDelegate(
            parentShadowField,
            targetShadowField?.value,
            propertyKey,
        );
    };
}

/**
 * Gets the static metadata field from the target.
 * @param target The target to get the metadata from.
 * @param shadowFieldKey The key of the shadow field.
 * @returns The metadata value.
 */
export function getStaticMetadata<T>(
    target: unknown,
    shadowFieldKey: PropertyKey,
): T | undefined {
    if (!target || !isIStaticMetadataField_<T>(target.constructor)) {
        throw new Error(
            'The metadata decorator can only be used on class properties.',
        );
    }

    const targetShadowField = Object.getOwnPropertyDescriptor(
        target.constructor,
        shadowFieldKey,
    );

    return targetShadowField?.value;
}
