export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userInput } = req.body;
    if (!userInput) {
        return res.status(400).json({ error: 'Missing userInput' });
    }

    // 1. 检查 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        console.error('DEEPSEEK_API_KEY is not set');
        return res.status(500).json({ error: 'Server config error: DEEPSEEK_API_KEY is missing' });
    }

    // 2. 准备系统提示
    const systemPrompt = `你是一位给小学生讲道理的寓言作家。根据用户输入创作故事，必须紧扣主题，500字左右，语言简单。输出格式：
【寓言故事】
标题
正文
【课堂提问】
1. xxx
2. xxx
3. xxx
【小组讨论】
一个话题
【老师总结】
一句话总结`;

    const userMessage = `班级事件：${userInput}。请写一个紧扣这个主题的寓言故事。`;

    try {
        // 3. 调用 DeepSeek API
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
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', response.status, errorText);
            return res.status(500).json({ error: `DeepSeek API error: ${response.status}` });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 4. 简单解析（先不管格式完美，直接返回原始内容也行）
        return res.status(200).json({
            fable: content,
            questions: ['请根据故事提问1', '提问2', '提问3'],
            discussion: '小组讨论话题',
            summary: '老师总结'
        });
    } catch (error) {
        console.error('Fetch error:', error);
        return res.status(500).json({ error: `Fetch error: ${error.message}` });
    }
}
