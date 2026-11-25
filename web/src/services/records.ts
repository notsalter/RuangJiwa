import { validRecord } from "./validation";
import type { Collection, Collections } from "../core/types";
export function decodeRecord<K extends Collection>(
  name: K,
  id: string,
  data: Record<string, unknown>,
): Collections[K] | null {
  const string = (key: string, required = false) =>
    data[key] === undefined ? !required : typeof data[key] === "string";
  let valid = name === "psychologists" || validRecord(name, data);
  if (name === "psychologists")
    valid &&=
      string("name", true) &&
      string("specialization") &&
      string("bio") &&
      string("photoUrl") &&
      (data.rating === undefined ||
        (typeof data.rating === "number" && Number.isFinite(data.rating)));
  return valid ? ({ ...data, id } as unknown as Collections[K]) : null;
}
