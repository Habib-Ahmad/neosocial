// Frontend validators - mirrors backend validation for real-time feedback

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
	id: string;
}

export const PASSWORD_RULES: PasswordRule[] = [
	{
		id: 'length',
		test: (pwd: string) => pwd.length >= 8,
		message: 'At least 8 characters',
	},
	{
		id: 'uppercase',
		test: (pwd: string) => /[A-Z]/.test(pwd),
		message: 'One uppercase letter',
	},
	{
		id: 'lowercase',
		test: (pwd: string) => /[a-z]/.test(pwd),
		message: 'One lowercase letter',
	},
	{
		id: 'number',
		test: (pwd: string) => /[0-9]/.test(pwd),
		message: 'One number',
	},
];

export const validatePassword = (password: string): ValidationResult => {
	if (!password) {
		return { isValid: false, errors: ['Password is required'] };
	}

	const errors = PASSWORD_RULES.filter((rule) => !rule.test(password)).map(
		(rule) => rule.message
	);

	return { isValid: errors.length === 0, errors };
};

export const getPasswordStrength = (
	password: string
): { score: number; label: string; color: string } => {
	if (!password) return { score: 0, label: 'Enter password', color: 'gray' };

	const passedRules = PASSWORD_RULES.filter((rule) =>
		rule.test(password)
	).length;

	if (passedRules <= 1) return { score: 25, label: 'Weak', color: 'red' };
	if (passedRules === 2) return { score: 50, label: 'Fair', color: 'orange' };
	if (passedRules === 3) return { score: 75, label: 'Good', color: 'yellow' };
	return { score: 100, label: 'Strong', color: 'green' };
};

// ============================================
// Feature 2: Profanity Filter
// ============================================

const PROFANE_WORDS = ['damn', 'hell', 'ass', 'crap'];

const LEET_SPEAK_MAP: Record<string, string> = {
	'@': 'a',
	$: 's',
	'0': 'o',
	'1': 'i',
	'3': 'e',
	'4': 'a',
	'5': 's',
};

const normalizeLeetSpeak = (text: string): string => {
	return text
		.toLowerCase()
		.replace(/[@$0-9]/g, (char) => LEET_SPEAK_MAP[char] || char);
};

const extractCleanWord = (word: string): string => {
	return word.replace(/[^a-z]/g, '');
};

export const checkProfanity = (text: string): ValidationResult => {
	if (!text?.trim()) {
		return { isValid: true, errors: [] };
	}

	const normalizedWords = normalizeLeetSpeak(text).split(/\s+/);
	const hasProfanity = normalizedWords.some((word) =>
		PROFANE_WORDS.includes(extractCleanWord(word))
	);

	if (hasProfanity) {
		return {
			isValid: false,
			errors: ['Content contains inappropriate language'],
		};
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

export const validateGroupName = (name: string): ValidationResult => {
	if (!name?.trim()) {
		return { isValid: false, errors: ['Group name is required'] };
	}

	const trimmedName = name.trim();
	const errors: string[] = [];
	const { minLength, maxLength, allowedPattern } = GROUP_NAME_CONFIG;

	if (trimmedName.length < minLength) {
		errors.push(`Group name must be at least ${minLength} characters`);
	}
	if (trimmedName.length > maxLength) {
		errors.push(`Group name must not exceed ${maxLength} characters`);
	}
	if (!allowedPattern.test(trimmedName)) {
		errors.push('Only letters, numbers, spaces, and hyphens allowed');
	}

	return { isValid: errors.length === 0, errors };
};

export const getGroupNameCharCount = (
	name: string
): { current: number; max: number; isOver: boolean } => {
	const current = name.trim().length;
	return {
		current,
		max: GROUP_NAME_CONFIG.maxLength,
		isOver: current > GROUP_NAME_CONFIG.maxLength,
	};
};
