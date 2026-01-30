const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using Admin Key
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const email = 'admin_create_test@example.com';
    const password = 'password123';

    console.log(`Attempting Admin Create User for: ${email}`);
    
    // bypass public signup limits
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true 
    });

    if (error) {
        console.error('❌ Admin Create Failed!');
        console.error('Message:', error.message);
    } else {
        console.log('✅ Admin Create Success!');
        console.log('User ID:', data.user.id);
        
        // Clean up
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('Cleaned up test user.');
    }
}

main();
