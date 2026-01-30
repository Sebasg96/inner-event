const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const email = process.argv[2];
    console.log(`Resetting password for ${email} to 'password123'...`);
    
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
        console.error('User not found');
        return;
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: 'password123'
    });

    if (error) console.error('Error:', error);
    else console.log('✅ Password Reset Success. New password: password123');
}

main();
