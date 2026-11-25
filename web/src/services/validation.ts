import type { PrivateCollection } from "../core/types";
import { moodOptions } from "../features/mood";

type Data = Record<string, unknown>;
type Check = (value: unknown) => boolean;
const text = (max: number): Check => (value) =>
  typeof value === "string" && value.length <= max;
const identifier: Check = (value) =>
  typeof value === "string" && value.length > 0 && !value.includes("/");
const iso: Check = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  ) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
};
const mood: Check = (value) =>
  moodOptions.some((option) => option.value === value);
const object = (value: unknown): value is Data =>
  value !== null && typeof value === "object" &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);
function invalid(): never {
  throw new Error("invalid-record-schema");
}
const schemas: Record<PrivateCollection, {
  fields: Record<string, Check>;
  required: string[];
}> = {
  moods: {
    fields: { userId: identifier, mood, createdAt: iso, note: text(2000) },
    required: ["userId", "mood", "createdAt"],
  },
  journals: {
    fields: {
      userId: identifier,
      createdAt: iso,
      mood,
      content: (value) =>
        text(10000)(value) && (value as string).trim().length >= 10,
      title: text(160),
      prompt: text(1000),
      tags: (value) =>
        Array.isArray(value) && value.length <= 10 &&
        Array.from(value).every((tag) =>
          text(40)(tag) && (tag as string).length > 0),
      isFavorite: (value) => typeof value === "boolean",
    },
    required: ["userId", "content", "createdAt"],
  },
  quizHistory: {
    fields: {
      userId: identifier,
      takenAt: iso,
      quizType: (value) => value === "stress" || value === "anxiety",
      score: (value) =>
        typeof value === "number" && Number.isInteger(value) &&
        value >= 0 && value <= 15,
      category: (value) => ["low", "moderate", "high"].includes(value as string),
    },
    required: ["userId", "quizType", "score", "category", "takenAt"],
  },
  consultations: {
    fields: {
      userId: identifier,
      psychologistId: (value) => identifier(value) && text(128)(value),
      scheduledAt: iso,
      notes: text(2000),
      status: (value) =>
        ["pending", "confirmed", "completed", "canceled"].includes(value as string),
    },
    required: ["userId", "psychologistId", "status", "scheduledAt"],
  },
};
export function assertWritableCollection(name: PrivateCollection): void {
  if (!Object.hasOwn(schemas, name)) invalid();
}
export function validRecord(name: PrivateCollection, data: unknown): data is Data {
  if (!Object.hasOwn(schemas, name)) return false;
  const schema = schemas[name];
  if (
    !schema || !object(data) ||
    Object.entries(data).some(([key, value]) =>
      !Object.hasOwn(schema.fields, key) || !schema.fields[key](value)) ||
    schema.required.some((key) => !Object.hasOwn(data, key))
  ) return false;
  return name !== "quizHistory" || data.category ===
    ((data.score as number) <= 6 ? "low" :
      (data.score as number) <= 12 ? "moderate" : "high");
}
export function updateRecord(
  name: PrivateCollection,
  uid: string,
  id: string,
  data: Data,
  current: Data,
): Data {
  assertWritableCollection(name);
  const schema = schemas[name];
  if (
    !schema || !object(data) || !object(current) ||
    !identifier(uid) || !identifier(id) || current.userId !== uid ||
    Object.hasOwn(data, "id") || Object.hasOwn(data, "userId")
  ) invalid();
  if (Object.entries(data).some(([key, value]) =>
    !Object.hasOwn(schema.fields, key) || (value === undefined
      ? schema.required.includes(key) : !schema.fields[key](value))
  )) invalid();
  const merged = { ...current };
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) delete merged[key];
    else merged[key] = value;
  }
  if (
    !validRecord(name, merged) || (name === "consultations" && (
      Object.keys(data).some((key) => key !== "status") ||
      current.status !== "pending" || data.status !== "canceled"
    ))
  ) invalid();
  return merged;
}
export function createRecord(name: PrivateCollection, uid: string, data: Data): Data {
  assertWritableCollection(name);
  if (
    !schemas[name] || !object(data) || !identifier(uid) ||
    Object.hasOwn(data, "id") || Object.hasOwn(data, "userId") ||
    Object.keys(data).some((key) => !Object.hasOwn(schemas[name].fields, key))
  ) invalid();
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  payload.userId = uid;
  if (
    !validRecord(name, payload) || (name === "consultations" && (
      payload.status !== "pending" ||
      Date.parse(payload.scheduledAt as string) <= Date.now()
    ))
  ) invalid();
  return payload;
}
