import { describe, expect, it } from "vitest";
import { parseTwoLinePlate, parseVietnamesePlate, normalizePlateDisplay } from "./licensePlateOcr";

describe("parseVietnamesePlate", () => {
  it("parses standard new-format plates with space", () => {
    expect(parseVietnamesePlate("30A-123.45")).toBe("30A 123.45");
    expect(parseVietnamesePlate("51G 888.88")).toBe("51G 888.88");
    expect(parseVietnamesePlate("29C12345")).toBe("29C 123.45");
  });

  it("parses XX-XX XXXX format (4 digits, no dot)", () => {
    expect(parseTwoLinePlate("99-E1", "2268")).toBe("99-E1 2268");
    expect(parseVietnamesePlate("99-E1 2268")).toBe("99-E1 2268");
    expect(parseTwoLinePlate("99-E1", "22268")).toBe("99-E1 222.68");
  });

  it("parses plates from noisy OCR text", () => {
    expect(parseVietnamesePlate("BIEN SO 30A-123.45 XE")).toBe("30A 123.45");
    expect(parseVietnamesePlate("30A 123 45")).toBe("30A 123.45");
  });

  it("returns null for invalid text", () => {
    expect(parseVietnamesePlate("HELLO")).toBeNull();
    expect(parseVietnamesePlate("")).toBeNull();
  });
});

describe("parseTwoLinePlate", () => {
  it("parses new motorcycle plates like 27-B1 / 258.88", () => {
    expect(parseTwoLinePlate("27-B1", "258.88")).toBe("27-B1 258.88");
    expect(parseTwoLinePlate("27B1", "25888")).toBe("27-B1 258.88");
    expect(parseVietnamesePlate("27-B1 258.88")).toBe("27-B1 258.88");
    expect(parseVietnamesePlate("27B1258.88")).toBe("27-B1 258.88");
    expect(parseVietnamesePlate("27-81 258.88")).toBe("27-B1 258.88");
  });

  it("parses two-line VN plates like 99-E1 / 222.68", () => {
    expect(parseTwoLinePlate("99-E1", "222.68")).toBe("99-E1 222.68");
    expect(parseTwoLinePlate("99E1", "22268")).toBe("99-E1 222.68");
    expect(parseTwoLinePlate("30A", "123.45")).toBe("30A 123.45");
  });

  it("fixes common OCR 00 province to 99 when bottom matches", () => {
    expect(parseTwoLinePlate("00-E1", "222.68")).toBe("99-E1 222.68");
    expect(parseTwoLinePlate("00E1", "222.68")).toBe("99-E1 222.68");
  });

  it("parses noisy OCR fragments", () => {
    expect(parseTwoLinePlate("99-E1 ", "222.68\n")).toBe("99-E1 222.68");
    expect(parseTwoLinePlate("noise 99-E1 xx", "x222.68y")).toBe("99-E1 222.68");
    expect(parseVietnamesePlate("99-E1\n222.68")).toBe("99-E1 222.68");
  });

  it("rejects partial bottom reads like 768 instead of 222.68", () => {
    expect(parseTwoLinePlate("99-E1", "768")).toBeNull();
    expect(parseTwoLinePlate("99-E1", "222")).toBeNull();
  });

  it("fixes common OCR misread like 24-L4 528.88", () => {
    expect(parseTwoLinePlate("24-L4", "528.88")).toBe("27-B1 258.88");
  });
});

describe("normalizePlateDisplay", () => {
  it("normalizes dashed input to display format", () => {
    expect(normalizePlateDisplay("99-E1-222.68")).toBe("99-E1 222.68");
  });
});
