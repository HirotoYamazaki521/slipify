const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  if (!email) return 'メールアドレスを入力してください'
  if (!EMAIL_REGEX.test(email)) return '有効なメールアドレスを入力してください'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'パスワードを入力してください'
  if (password.length < 6) return 'パスワードは6文字以上で入力してください'
  return null
}

export function validateAuthForm(
  email: string,
  password: string
): { email: string | null; password: string | null; hasError: boolean } {
  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  return {
    email: emailError,
    password: passwordError,
    hasError: emailError !== null || passwordError !== null,
  }
}
