export const PASSWORD_MIN = 8;
// Supabase hashes passwords with bcrypt, which only reads the first 72 bytes.
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_RULES = `At least ${PASSWORD_MIN} characters, with a letter and a number.`;

/*
  Returns what is wrong with a password, in plain language (empty list = fine).
  This is only a courtesy check in the browser; Supabase still enforces its own
  rules, and the password itself is never stored by VEYORAQ, only by Supabase Auth.
*/
export function validatePassword(password: string, email = ""): string[] {
  const problems: string[] = [];

  if (password.length < PASSWORD_MIN) {
    problems.push(`Use at least ${PASSWORD_MIN} characters.`);
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    problems.push("That password is too long. Use 72 characters or fewer.");
  }
  if (!/[A-Za-z]/.test(password)) {
    problems.push("Include at least one letter.");
  }
  if (!/\d/.test(password)) {
    problems.push("Include at least one number.");
  }
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail && password.toLowerCase() === cleanEmail) {
    problems.push("Don't use your email address as your password.");
  }

  return problems;
}
