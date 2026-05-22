import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput, authCode } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: '请输入道理或班级事件' });
  }
  if (!authCode) {
    return res.status(400).json({ error: '请先验证授权码' });
  }

  // 1. 查询授权码剩余次数
  const { data: codeData, error: queryError } = await supabase
    .from('auth_codes')
    .select('code, total_quota, used_count')
    .eq('code', authCode)
    .single();

  if (queryError || !codeData) {
    console.error('授权码查询失败:', queryError);
    return res.status(401).json({ error: '无效的授权码' });
  }

  const remaining = codeData.total_quota - codeData.used_count;
  if (remaining <= 0) {
    return res.status(403).json({ error: '此授权码次数已用完，请联系购买新码' });
  }

  // 2. 调用 DeepSeek API
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '服务器配置错误：缺少 API 密钥' });
  }

  const systemPrompt = `你是一位给小学生讲道理的寓言作家。根据用户输入的班级事件，创作一个直接围绕该事件的寓言故事。
要求：
- 故事必须紧扣用户输入的主题（例如“不想值日”），不要偏离到其他道理。
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
      console.error('DeepSeek API 错误:', response.status, errorText);
      return res.status(500).json({ error: 'AI 服务出错，请稍后再试' });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = parseResponse(content);

    // 3. 更新使用次数（生成成功后）
    const { error: updateError } = await supabase
      .from('auth_codes')
      .update({ used_count: codeData.used_count + 1 })
      .eq('code', authCode);

    if (updateError) {
      console.error('更新次数失败:', updateError);
      // 不返回错误，只记录日志
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('处理错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
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
