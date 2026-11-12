import { AuthProvider } from '@/src/auth/auth-context';
import { AuthGate } from '@/src/auth/auth-gate';
import { DemoProvider } from '@/src/demo/store';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DemoProvider>
        <AuthGate />
      </DemoProvider>
    </AuthProvider>
  );
}
