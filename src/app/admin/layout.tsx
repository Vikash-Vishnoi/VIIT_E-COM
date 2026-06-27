import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Get the token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login?returnTo=/admin');
  }

  // 2. Decode the token to get the email
  const payload = await verifyToken(token);
  if (!payload || !payload.email) {
    redirect('/login?returnTo=/admin');
  }

  // 3. Connect to the database and verify the role securely
  await connectDB();
  const user = await User.findOne({ email: payload.email }).select('role isActive').lean();

  if (!user || !user.isActive || user.role !== 'admin') {
    redirect('/'); // Kick them out to the homepage if not an active admin
  }

  // 4. If all checks pass, render the sidebar UI
  return <AdminSidebar>{children}</AdminSidebar>;
}
