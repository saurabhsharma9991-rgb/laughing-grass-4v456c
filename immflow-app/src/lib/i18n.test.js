import { describe, expect, it } from "vitest";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import hi from "@/locales/hi.json";
import ru from "@/locales/ru.json";
import zh from "@/locales/zh.json";

function keys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return item && typeof item === "object" ? keys(item, path) : [path];
  });
}

describe("locale catalogs", () => {
  it("keep every supported locale at key parity with English", () => {
    const expected = keys(en).sort();
    for (const catalog of [es, hi, ru, zh]) {
      expect(keys(catalog).sort()).toEqual(expected);
    }
  });
});
