import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = { title: 'Host sign in — LoveAfrica' };

export default function HostLoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" audience="host" />
    </Suspense>
  );
}
