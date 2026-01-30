const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase Env Vars!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('--- Supabase Login Diagnostic ---');
console.log('Connecting to:', supabaseUrl);

rl.question('Enter Email: ', (email) => {
    rl.question('Enter Password: ', async (password) => {
        
        console.log(`\nAttempting login for ${email}...`);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('\n❌ Login Failed!');
            console.error('Error Status:', error.status);
            console.error('Error Message:', error.message);
            console.error('Error Name:', error.name);
            
            if (error.message.includes('Email not confirmed')) {
                console.log('\n⚠️  DIAGNOSIS: The email address has not been confirmed.');
                console.log('   Solution: Go to Supabase Auth -> Users, find the user, and click "Confirm" or check "Auto Confirm" in settings.');
            }
        } else {
            console.log('\n✅ Supabase Login SUCCESS!');
            console.log('User ID:', data.user.id);
            console.log('Email:', data.user.email);
            console.log('Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
        }

        rl.close();
    });
});
