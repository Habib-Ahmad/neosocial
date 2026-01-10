// TDD Feature: Validators
// GREEN Phase - Implementation to make tests pass

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Feature 1: Password Strength Validator
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Feature 2: Profanity Filter
const PROFANE_WORDS = ["damn", "hell", "ass", "crap"];

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s");
};

export const checkProfanity = (text: string): ValidationResult => {
  if (!text || text.length === 0) {
    return { isValid: true, errors: [] };
  }

  const normalizedText = normalizeText(text);
  const words = normalizedText.split(/\s+/);

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, "");
    if (PROFANE_WORDS.includes(cleanWord)) {
      return {
        isValid: false,
        errors: ["Post contains inappropriate language"],
      };
    }
  }

  return {
    isValid: true,
    errors: [],
  };
};

// Feature 3: Group Name Validator
export const validateGroupName = (name: string, existingNames: string[] = []): ValidationResult => {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push("Group name is required");
    return { isValid: false, errors };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 3) {
    errors.push("Group name must be at least 3 characters long");
  }

  if (trimmedName.length > 50) {
    errors.push("Group name must not exceed 50 characters");
  }

  if (!/^[a-zA-Z0-9\s-]+$/.test(trimmedName)) {
    errors.push("Group name can only contain letters, numbers, spaces, and hyphens");
  }

  const lowerName = trimmedName.toLowerCase();
  const isDuplicate = existingNames.some((existing) => existing.toLowerCase() === lowerName);
  if (isDuplicate) {
    errors.push("Group name already exists");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
