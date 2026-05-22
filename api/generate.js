import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput, authCode } = req.body;
  if (!userInput) {
    return res.status(400).json({ error: 'Missing userInput' });
  }

  // 初始化 Supabase 客户端
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env variables');
    return res.status(500).json({ error: 'Server config error' });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 判断是否为免费试用模式（没有提供 authCode）
  const isTrial = !authCode;

  if (!isTrial) {
    // 授权码模式（付费用户）
    const { data: codeData, error: queryError } = await supabase
      .from('auth_codes')
      .select('code, total_quota, used_count')
      .eq('code', authCode)
      .maybeSingle();

    if (queryError || !codeData) {
      console.error('授权码查询失败:', queryError);
      return res.status(401).json({ error: '无效的授权码' });
    }

    const remaining = codeData.total_quota - codeData.used_count;
    if (remaining <= 0) {
      return res.status(403).json({ error: '此授权码次数已用完，请联系购买新码' });
    }

    // 调用 DeepSeek API 生成故事（复用通用函数）
    const result = await generateStory(userInput);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // 更新授权码使用次数
    const { error: updateError } = await supabase
      .from('auth_codes')
      .update({ used_count: codeData.used_count + 1 })
      .eq('code', authCode);
    if (updateError) console.error('更新次数失败:', updateError);

    return res.status(200).json(result);
  } else {
    // 免费试用模式：基于设备标识限制
    // 获取真实 IP（Vercel 环境下使用 x-forwarded-for）
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const deviceId = crypto.createHash('md5').update(ip + userAgent).digest('hex');

    // 查询该设备的试用记录
    let { data: trialData, error: trialError } = await supabase
      .from('trial_usage')
      .select('used_count')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (trialError && trialError.code !== 'PGRST116') { // PGRST116 表示无记录，不是错误
      console.error('查询试用记录失败:', trialError);
      return res.status(500).json({ error: '试用检查失败' });
    }

    const usedCount = trialData ? trialData.used_count : 0;
    if (usedCount >= 2) {
      return res.status(403).json({ error: '免费试用次数已用完（2次），请购买授权码' });
    }

    // 调用 DeepSeek API 生成故事
    const result = await generateStory(userInput);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // 更新试用次数
    if (trialData) {
      await supabase
        .from('trial_usage')
        .update({ used_count: usedCount + 1, updated_at: new Date() })
        .eq('device_id', deviceId);
    } else {
      await supabase
        .from('trial_usage')
        .insert({ device_id: deviceId, used_count: 1 });
    }

    return res.status(200).json(result);
  }
}

// 通用的故事生成函数（调用 DeepSeek API）
async function generateStory(userInput) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { error: 'Missing DeepSeek API key' };
  }

  const systemPrompt = `你是一位给小学生讲道理的寓言作家。根据用户输入的班级事件，创作一个直接围绕该事件的寓言故事。
要求：
- 故事必须紧扣用户输入的主题，不要偏离。
- 角色可以是学生、老师或教室里的物品。
- 故事长度400-600字，语言简单，适合小学生。
- 输出格式：
【寓言故事】
标题
正文
【课堂提问】
1. ...
2. ...
3. ...
【小组讨论】
一个话题
【老师总结】
一句话总结（用隐喻）`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return { error: 'AI service error' };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return parseResponse(content);
  } catch (error) {
    console.error('Handler error:', error);
    return { error: 'Internal server error' };
  }
}

function parseResponse(content) {
  let fable = '';
  let questions = [];
  let discussion = '';
  let summary = '';

  const fableMatch = content.match(/【寓言故事】\s*([\s\S]*?)(?=【课堂提问】|$)/);
  if (fableMatch) fable = fableMatch[1].trim();

  const questionsMatch = content.match(/【课堂提问】\s*([\s\S]*?)(?=【小组讨论】|$)/);
  if (questionsMatch) {
    const qText = questionsMatch[1].trim();
    questions = qText.split(/\n/).filter(line => line.trim() && /^\d+\./.test(line));
  }

  const discussionMatch = content.match(/【小组讨论】\s*([\s\S]*?)(?=【老师总结】|$)/);
  if (discussionMatch) discussion = discussionMatch[1].trim();

  const summaryMatch = content.match(/【老师总结】\s*([\s\S]*?)$/);
  if (summaryMatch) summary = summaryMatch[1].trim();

  if (!fable) fable = '故事生成失败，请稍后重试。';
  if (questions.length === 0) questions = ['故事里发生了什么？', '主角是怎么做的？', '你学到了什么？'];
  if (!discussion) discussion = '小组讨论这个故事给我们的启发。';
  if (!summary) summary = '道理藏在故事里。';

  return { fable, questions, discussion, summary };
}
