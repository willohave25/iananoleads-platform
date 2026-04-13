/* ================================================
   iaNanoLeads — Configuration Supabase
   Client + helpers CRUD et Storage
   ================================================ */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[Supabase] Variables SUPABASE_URL et SUPABASE_SERVICE_KEY requises');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Helpers génériques ---

async function insert(table, data) {
  const { data: result, error } = await supabase.from(table).insert(data).select();
  if (error) throw error;
  return result;
}

async function select(table, filters = {}) {
  let query = supabase.from(table).select('*');
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function update(table, filters = {}, updates = {}) {
  let query = supabase.from(table).update(updates);
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  const { data, error } = await query.select();
  if (error) throw error;
  return data;
}

async function remove(table, filters = {}) {
  let query = supabase.from(table).delete();
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  const { error } = await query;
  if (error) throw error;
  return true;
}

// --- Storage ---

async function uploadFile(bucket, path, content, contentType = 'text/csv') {
  const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

module.exports = { supabase, insert, select, update, remove, uploadFile };
