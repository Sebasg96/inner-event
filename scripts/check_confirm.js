const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase Env Vars!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
    console.log(`Checking status for: ${email}`);
    
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User Not Found in Auth!');
        return;
    }

    console.log('User Found:', user.id);
    console.log('Email Confirmed At:', user.email_confirmed_at);
    console.log('Last Sign In:', user.last_sign_in_at);
    
    if (!user.email_confirmed_at) {
        console.log('⚠️ Email NOT confirmed. Confirming now...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            email_confirmed_at: new Date().toISOString() // Force confirm
        });
        
        if (updateError) {
             console.error('Failed to confirm email:', updateError);
        } else {
             console.log('✅ Email manually confirmed!');
        }
    } else {
        console.log('✅ Email is already confirmed.');
    }
}

const email = process.argv[2];
if (email) checkUser(email);
else console.log('Usage: node scripts/check_confirm.js <email>');
