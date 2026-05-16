// Shared scalar-field type.
// A `res × res × res` cube stored flat in z-major order:
//   data[z * res * res + y * res + x]

export type Field = { data: Float32Array; res: number };
