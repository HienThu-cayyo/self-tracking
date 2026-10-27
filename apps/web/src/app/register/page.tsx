import { AuthForm, AuthShell } from "@/_features/auth"

export default function RegisterPage() {
  return (
    <AuthShell title="Tạo tài khoản" subtitle="Bắt đầu xây dựng không gian học tập riêng của bạn.">
      <AuthForm mode="register" />
    </AuthShell>
  )
}
