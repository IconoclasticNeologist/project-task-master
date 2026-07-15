// Spanish copy bundle — SCAFFOLD: currently mirrors English so the language
// infrastructure lands green; the full es-419 translation replaces this
// object in the same change series (usted register, same language rules).
// The `typeof copyEn` annotation makes completeness a compile error.
import { copy as copyEn } from "../en";

export const copyEs: typeof copyEn = copyEn;
