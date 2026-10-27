import { AuthForm, AuthShell } from "@/_features/auth"

export default function LoginPage() {
  return (
    <AuthShell
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục theo dõi việc học của bạn."
    >
      <AuthForm mode="login" />
    </AuthShell>
  )
}
