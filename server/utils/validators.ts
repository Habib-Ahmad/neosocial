// TDD Feature: Validators
// REFACTOR Phase - Improved code quality, maintainability, and structure

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================
// Feature 1: Password Strength Validator
// ============================================

interface PasswordRule {
  test: (password: string) => boolean;
  message: string;
}

const PASSWORD_CONFIG = {
  minLength: 8,
  rules: [
    {
      test: (pwd: string) => pwd.length >= 8,
      message: "Password must be at least 8 characters long",
    },
    {
      test: (pwd: string) => /[A-Z]/.test(pwd),
      message: "Password must contain at least one uppercase letter",
    },
    {
      test: (pwd: string) => /[a-z]/.test(pwd),
      message: "Password must contain at least one lowercase letter",
    },
    {
      test: (pwd: string) => /[0-9]/.test(pwd),
      message: "Password must contain at least one number",
    },
  ] as PasswordRule[],
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, errors: ["Password is required"] };
  }

  const errors = PASSWORD_CONFIG.rules
    .filter((rule) => !rule.test(password))
    .map((rule) => rule.message);

  return { isValid: errors.length === 0, errors };
};

// ============================================
// Feature 2: Profanity Filter
// ============================================

const PROFANITY_CONFIG = {
  blockedWords: ["damn", "hell", "ass", "crap", "shit", "merde"],
  leetSpeakMap: {
    "@": "a",
    $: "s",
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
  } as Record<string, string>,
};

const normalizeLeetSpeak = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[@$0-9]/g, (char) => PROFANITY_CONFIG.leetSpeakMap[char] || char);
};

const extractCleanWord = (word: string): string => {
  return word.replace(/[^a-z]/g, "");
};

const containsProfanity = (text: string): boolean => {
  const normalizedWords = normalizeLeetSpeak(text).split(/\s+/);
  return normalizedWords.some((word) =>
    PROFANITY_CONFIG.blockedWords.includes(extractCleanWord(word))
  );
};

export const checkProfanity = (text: string): ValidationResult => {
  if (!text?.trim()) {
    return { isValid: true, errors: [] };
  }

  if (containsProfanity(text)) {
    return { isValid: false, errors: ["Post contains inappropriate language"] };
  }

  return { isValid: true, errors: [] };
};

// ============================================
// Feature 3: Group Name Validator
// ============================================

const GROUP_NAME_CONFIG = {
  minLength: 3,
  maxLength: 50,
  allowedPattern: /^[a-zA-Z0-9\s-]+$/,
};

const validateGroupNameFormat = (name: string): string[] => {
  const errors: string[] = [];
  const { minLength, maxLength, allowedPattern } = GROUP_NAME_CONFIG;

  if (name.length < minLength) {
    errors.push(`Group name must be at least ${minLength} characters long`);
  }
  if (name.length > maxLength) {
    errors.push(`Group name must not exceed ${maxLength} characters`);
  }
  if (!allowedPattern.test(name)) {
    errors.push("Group name can only contain letters, numbers, spaces, and hyphens");
  }

  return errors;
};

const isNameTaken = (name: string, existingNames: string[]): boolean => {
  const lowerName = name.toLowerCase();
  return existingNames.some((existing) => existing.toLowerCase() === lowerName);
};

export const validateGroupName = (name: string, existingNames: string[] = []): ValidationResult => {
  if (!name?.trim()) {
    return { isValid: false, errors: ["Group name is required"] };
  }

  const trimmedName = name.trim();
  const errors = validateGroupNameFormat(trimmedName);

  if (isNameTaken(trimmedName, existingNames)) {
    errors.push("Group name already exists");
  }

  return { isValid: errors.length === 0, errors };
};
