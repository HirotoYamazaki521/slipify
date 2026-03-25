import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, validateAuthForm } from '@/lib/auth/validation'

describe('validateEmail', () => {
  it('有効なメールアドレスを通過させる', () => {
    expect(validateEmail('user@example.com')).toBeNull()
    expect(validateEmail('user.name+tag@domain.co.jp')).toBeNull()
  })

  it('空文字はエラー', () => {
    expect(validateEmail('')).toBe('メールアドレスを入力してください')
  })

  it('@なしはエラー', () => {
    expect(validateEmail('notanemail')).toBe('有効なメールアドレスを入力してください')
  })

  it('ドメインなしはエラー', () => {
    expect(validateEmail('user@')).toBe('有効なメールアドレスを入力してください')
  })

  it('ローカルパートなしはエラー', () => {
    expect(validateEmail('@example.com')).toBe('有効なメールアドレスを入力してください')
  })
})

describe('validatePassword', () => {
  it('6文字以上のパスワードを通過させる', () => {
    expect(validatePassword('password')).toBeNull()
    expect(validatePassword('123456')).toBeNull()
  })

  it('空文字はエラー', () => {
    expect(validatePassword('')).toBe('パスワードを入力してください')
  })

  it('5文字以下はエラー', () => {
    expect(validatePassword('12345')).toBe('パスワードは6文字以上で入力してください')
  })
})

describe('validateAuthForm', () => {
  it('有効なメールとパスワードはエラーなし', () => {
    const result = validateAuthForm('user@example.com', 'password123')
    expect(result.email).toBeNull()
    expect(result.password).toBeNull()
    expect(result.hasError).toBe(false)
  })

  it('両方無効な場合は両方エラー', () => {
    const result = validateAuthForm('', '')
    expect(result.email).not.toBeNull()
    expect(result.password).not.toBeNull()
    expect(result.hasError).toBe(true)
  })

  it('メールのみ無効', () => {
    const result = validateAuthForm('invalid', 'password123')
    expect(result.email).not.toBeNull()
    expect(result.password).toBeNull()
    expect(result.hasError).toBe(true)
  })

  it('パスワードのみ無効', () => {
    const result = validateAuthForm('user@example.com', '123')
    expect(result.email).toBeNull()
    expect(result.password).not.toBeNull()
    expect(result.hasError).toBe(true)
  })
})
