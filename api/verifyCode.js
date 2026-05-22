import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  // 查询授权码是否存在（不论次数是否用完）
  const { data, error } = await supabase
    .from('auth_codes')
    .select('code')
    .eq('code', code)
    .maybeSingle();

  if (error || !data) {
    return res.status(401).json({ valid: false, error: '无效的授权码' });
  }

  return res.status(200).json({ valid: true });
}
