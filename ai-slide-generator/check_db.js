
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking ai_logs table schema...');
  
  // Try to fetch one row and check its keys
  const { data, error } = await supabase
    .from('ai_logs')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching from ai_logs:', error);
    return;
  }

  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log('Columns found in ai_logs:', columns);
    
    const required = ['client_prompt', 'full_prompt', 'is_valid'];
    const missing = required.filter(col => !columns.includes(col));
    
    if (missing.length > 0) {
      console.warn('MISSING COLUMNS:', missing);
      console.log('You need to run the migration script: supabase_migration_ai_logs_v2.sql');
    } else {
      console.log('SUCCESS: All required columns are present.');
    }
  } else {
    console.log('No data in ai_logs table to check columns via object keys. Trying information_schema...');
    
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'ai_logs' });
    // Note: get_table_columns RPC might not exist. Falling back to a direct query if possible.
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('ai_logs')
      .select('client_prompt, full_prompt, is_valid')
      .limit(0);
      
    if (schemaError) {
      console.warn('Columns are likely MISSING or there is a permission issue:', schemaError.message);
    } else {
      console.log('SUCCESS: Columns are present in the schema.');
    }
  }
}

checkSchema();
