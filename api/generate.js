// 班会寓言故事生成器 - Vercel Serverless Function
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userInput } = req.body;
        if (!userInput) {
            return res.status(400).json({ error: 'Missing userInput' });
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            console.error('DEEPSEEK_API_KEY not configured');
            return res.status(500).json({ error: 'API key missing' });
        }

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是一个小学班级管理寓言作家。根据用户输入创作紧密相关的寓言故事。

【硬性约束】
1. 故事必须紧紧围绕用户输入的具体事件或道理，严禁跑题。
2. 故事正文长度：**不少于400字，不超过600字**。
3. 故事需包含：标题、至少两个角色、情节冲突或转折、解决过程、隐喻的道理。
4. 语言适合小学生，生动有趣。
5. 不要直接说出道理名称，用故事本身传递寓意。
6. 严格按以下格式输出：

【寓言故事】
标题
正文（分段，400-600字）

【课堂提问】
1. xxx
2. xxx
3. xxx

【小组讨论】
一个讨论问题

【老师总结】
一句隐喻性总结`
                    },
                    {
                        role: 'user',
                        content: `班级事件或道理：${userInput}\n\n请创作一个紧扣主题的寓言故事，正文不少于400字。`
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000  // 确保足够输出长故事
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('DeepSeek API error:', response.status, errText);
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

    if (!fable) {
        fable = content.replace(/【.*?】/g, '').trim();
    }
    if (questions.length === 0) questions = ['你觉得故事里谁的做法对？', '如果是你会怎么做？', '这个故事告诉我们什么道理？'];
    if (!discussion) discussion = '小组讨论：如何把这个道理用到我们班？';
    if (!summary) summary = '道理往往藏在故事里。';

    return { fable, questions, discussion, summary };
}
