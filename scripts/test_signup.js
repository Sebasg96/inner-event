const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const email = process.argv[2] || 'test_signup_diagnostic@example.com';
    const password = 'password123';

    console.log(`Attempting Supabase SignUp with: ${email}`);
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        console.error('❌ Signup Failed!');
        console.error('Status:', error.status);
        console.error('Message:', error.message);
    } else {
        console.log('✅ Signup Success!');
        console.log('User ID:', data.user?.id);
    }
}

main();
