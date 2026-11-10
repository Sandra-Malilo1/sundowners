import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = { title: 'Become a host — LoveAfrica' };

export default function HostRegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="register" audience="host" />
    </Suspense>
  );
}
