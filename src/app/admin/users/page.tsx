import { getTenantUsers } from '@/app/actions';
import AdminUsersClient from './AdminUsersClient';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma'; // Make sure this path is correct

export default async function AdminUsersPage() {
    // 1. Verify access strictly
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { role: true }
    });

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPERADMIN')) {
        redirect('/'); // Redirect unauthorized users
    }

    // 2. Fetch Users
    const users = await getTenantUsers();

    // 3. Render Client Component
    return <AdminUsersClient initialUsers={users} />;
}
