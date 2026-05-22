// 班会寓言故事生成器 - Vercel Serverless Function
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { userInput } = req.body;
        if (!userInput) return res.status(400).json({ error: 'Missing userInput' });

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'API key missing' });

        // 系统提示 —— 融合了你的原始寓言写作精髓 + 强主题绑定 + 小学生语言
        const systemPrompt = `你是一位擅长给小学生讲道理的寓言作家。请根据用户输入的班级事件或道理，创作一个生动有趣的寓言故事。

【核心要求】
1. **紧扣主题**：用户输入了什么，故事就必须围绕什么。例如用户说“学生总爱告状”，你的故事就要写“告状”带来的麻烦和如何正确解决矛盾，绝对不能写成“诚实”“勤奋”“抄袭”等无关主题。
2. **语言风格**：面向小学生，句子短，词语简单，有具体画面（比如“小刺猬气鼓鼓地跑去告状”）。不要用“因此”“从而”“培养良好品德”这类书面语。
3. **寓言写法（参考你的要求）**：
   - 故事精炼，500字左右（不少于400，不超过600）。
   - 用动物、植物或普通小孩做主角，不超过3个角色。
   - 通过一两次情节转折讲道理，全程不直接说出道理的名称（比如不说“大家要团结”）。
   - 避免老套路：不要用智者点化、临终遗言、村庄异象；不要出现“从前有个地方”；避开钟、河流、镜子等陈旧的意象。
   - 鼓励现代场景：可以发生在教室、操场、食堂、家庭，或者用外卖员、菜市场等职业。
4. **输出格式**（严格按下面格式，不要多也不要少）：

【寓言故事】
故事标题
故事正文（分段）

【课堂提问】
1. 问题一
2. 问题二
3. 问题三

【小组讨论】
一个讨论话题（一句话）

【老师总结】
一句总结（仍然用故事里的隐喻，不要说破道理）`;

        const userMessage = `班级事件或道理：${userInput}
请严格按照上述要求，写出一个紧扣“${userInput}”这个主题的寓言故事，正文400-600字。`;

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
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.8,   // 稍微提高一点创造性，避免套路
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', response.status, errorText);
            return res.status(500).json({ error: 'AI service error' });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const result = parseDeepSeekResponse(content);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Handler error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

function parseDeepSeekResponse(content) {
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

    // 保底内容
    if (!fable) fable = '故事生成失败，请稍后重试。';
    if (questions.length === 0) questions = ['故事里出现了什么问题？', '角色是怎么解决的？', '你从中学到了什么？'];
    if (!discussion) discussion = '小组讨论：这个故事和我们的班级有什么联系？';
    if (!summary) summary = '想一想，故事里藏着什么道理？';

    return { fable, questions, discussion, summary };
}
