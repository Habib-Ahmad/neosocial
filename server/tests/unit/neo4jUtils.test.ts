import neo4j from "neo4j-driver";
import { toNumber, timestampToDate } from "../../utils/neo4j";

jest.mock("neo4j-driver", () => ({
  isInt: jest.fn(),
}));

describe("Neo4j Utilities", () => {
  describe("toNumber", () => {
    it("should convert neo4j Integer to number", () => {
      const mockInt = {
        toNumber: jest.fn().mockReturnValue(42),
      };
      (neo4j.isInt as any).mockReturnValue(true);

      const result = toNumber(mockInt);

      expect(result).toBe(42);
      expect(mockInt.toNumber).toHaveBeenCalled();
    });

    it("should extract low property from object", () => {
      (neo4j.isInt as any).mockReturnValue(false);
      const value = { low: 123, high: 0 };

      const result = toNumber(value);

      expect(result).toBe(123);
    });

    it("should return primitive number as is", () => {
      (neo4j.isInt as any).mockReturnValue(false);
      const value = 456;

      const result = toNumber(value);

      expect(result).toBe(456);
    });

    it("should return null as is", () => {
      (neo4j.isInt as any).mockReturnValue(false);

      const result = toNumber(null);

      expect(result).toBe(null);
    });

    it("should return undefined as is", () => {
      (neo4j.isInt as any).mockReturnValue(false);

      const result = toNumber(undefined);

      expect(result).toBe(undefined);
    });
  });

  describe("timestampToDate", () => {
    beforeEach(() => {
      (neo4j.isInt as any).mockReturnValue(false);
    });

    it("should convert neo4j timestamp to Date", () => {
      const timestamp = {
        year: { low: 2024 },
        month: { low: 3 },
        day: { low: 15 },
        hour: { low: 14 },
        minute: { low: 30 },
        second: { low: 45 },
      };

      const result = timestampToDate(timestamp);

      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(2); // 0-indexed
      expect(result.getUTCDate()).toBe(15);
      expect(result.getUTCHours()).toBe(14);
      expect(result.getUTCMinutes()).toBe(30);
      expect(result.getUTCSeconds()).toBe(45);
    });

    it("should handle timestamp with primitive numbers", () => {
      const timestamp = {
        year: 2026,
        month: 1,
        day: 10,
        hour: 12,
        minute: 0,
        second: 0,
      };

      const result = timestampToDate(timestamp);

      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(0);
      expect(result.getUTCDate()).toBe(10);
    });

    it("should handle midnight timestamp", () => {
      const timestamp = {
        year: { low: 2025 },
        month: { low: 12 },
        day: { low: 31 },
        hour: { low: 0 },
        minute: { low: 0 },
        second: { low: 0 },
      };

      const result = timestampToDate(timestamp);

      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
    });

    it("should handle end of day timestamp", () => {
      const timestamp = {
        year: { low: 2023 },
        month: { low: 6 },
        day: { low: 15 },
        hour: { low: 23 },
        minute: { low: 59 },
        second: { low: 59 },
      };

      const result = timestampToDate(timestamp);

      expect(result.getUTCHours()).toBe(23);
      expect(result.getUTCMinutes()).toBe(59);
      expect(result.getUTCSeconds()).toBe(59);
    });
  });
});
