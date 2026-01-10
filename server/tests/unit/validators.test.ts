import { describe, expect, it } from "@jest/globals";
import { validatePassword, checkProfanity, validateGroupName } from "../../utils/validators";

/**
 * TDD Test Suite - RED Phase
 * All tests are written BEFORE implementation
 * These tests MUST FAIL initially
 */

// ============================================
// FEATURE 1: Password Strength Validator
// ============================================
describe("Feature 1: Password Strength Validator", () => {
  describe("validatePassword", () => {
    it("should reject empty password", () => {
      const result = validatePassword("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password is required");
    });

    it("should reject password shorter than 8 characters", () => {
      const result = validatePassword("Ab1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters long");
    });

    it("should reject password without uppercase letter", () => {
      const result = validatePassword("abcd1234");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one uppercase letter");
    });

    it("should reject password without lowercase letter", () => {
      const result = validatePassword("ABCD1234");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one lowercase letter");
    });

    it("should reject password without a number", () => {
      const result = validatePassword("Abcdefgh");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one number");
    });

    it("should accept valid password with all requirements", () => {
      const result = validatePassword("Password123");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return multiple errors for multiple violations", () => {
      const result = validatePassword("abc");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

// ============================================
// FEATURE 2: Profanity Filter
// ============================================
describe("Feature 2: Profanity Filter", () => {
  describe("checkProfanity", () => {
    it("should accept clean text", () => {
      const result = checkProfanity("Hello, this is a nice post!");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject text with profanity", () => {
      const result = checkProfanity("This is damn bad");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Post contains inappropriate language");
    });

    it("should detect profanity regardless of case", () => {
      const result = checkProfanity("This is DAMN bad");
      expect(result.isValid).toBe(false);
    });

    it("should detect multiple profane words", () => {
      const result = checkProfanity("What the hell and damn");
      expect(result.isValid).toBe(false);
    });

    it("should accept empty text", () => {
      const result = checkProfanity("");
      expect(result.isValid).toBe(true);
    });

    it("should not flag partial word matches", () => {
      // "class" contains "ass" but should not be flagged
      const result = checkProfanity("I have a class today");
      expect(result.isValid).toBe(true);
    });

    it("should detect profanity with special characters", () => {
      const result = checkProfanity("What the h3ll");
      expect(result.isValid).toBe(false);
    });
  });
});

// ============================================
// FEATURE 3: Group Name Validator
// ============================================
describe("Feature 3: Group Name Validator", () => {
  describe("validateGroupName", () => {
    it("should reject empty group name", () => {
      const result = validateGroupName("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Group name is required");
    });

    it("should reject whitespace-only name", () => {
      const result = validateGroupName("   ");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Group name is required");
    });

    it("should reject name shorter than 3 characters", () => {
      const result = validateGroupName("AB");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Group name must be at least 3 characters long");
    });

    it("should reject name longer than 50 characters", () => {
      const longName = "A".repeat(51);
      const result = validateGroupName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Group name must not exceed 50 characters");
    });

    it("should reject name with special characters", () => {
      const result = validateGroupName("Group@Name!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Group name can only contain letters, numbers, spaces, and hyphens");
    });

    it("should accept valid group name", () => {
      const result = validateGroupName("My Cool Group");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept name with numbers and hyphens", () => {
      const result = validateGroupName("Group-123");
      expect(result.isValid).toBe(true);
    });

    it("should reject duplicate group name (case insensitive)", () => {
      const existingNames = ["Tech Lovers", "Sports Fans"];
      const result = validateGroupName("TECH LOVERS", existingNames);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Group name already exists");
    });

    it("should accept unique group name", () => {
      const existingNames = ["Tech Lovers", "Sports Fans"];
      const result = validateGroupName("Music Lovers", existingNames);
      expect(result.isValid).toBe(true);
    });

    it("should trim name before validation", () => {
      const result = validateGroupName("  Valid Group  ");
      expect(result.isValid).toBe(true);
    });
  });
});
