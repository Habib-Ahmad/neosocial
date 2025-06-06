import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export const resolveImageUrl = (path: string): string => {
	if (!path) return '/default.png'; // fallback if empty

	// If the path already includes "http" or "https", treat it as external
	if (path.startsWith('http://') || path.startsWith('https://')) {
		return path;
	}

	// Otherwise, assume it's a local path and prepend the server URL
	return `http://localhost:5000${path}`;
};
