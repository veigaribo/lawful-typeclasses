export const metadataKey = Symbol('Lawful Typeclass Metadata')

export interface Metadatable<T> {
  [metadataKey]: T
}
