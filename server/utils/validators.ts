// TDD Feature: Validators
// RED Phase - Functions not implemented yet, tests will fail

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Feature 1: Password Strength Validator
export const validatePassword = (password: string): ValidationResult => {
  // TODO: Implement in GREEN phase
  throw new Error("Not implemented");
};

// Feature 2: Profanity Filter
export const checkProfanity = (text: string): ValidationResult => {
  // TODO: Implement in GREEN phase
  throw new Error("Not implemented");
};

// Feature 3: Group Name Validator
export const validateGroupName = (
  name: string,
  existingNames?: string[]
): ValidationResult => {
  // TODO: Implement in GREEN phase
  throw new Error("Not implemented");
};
