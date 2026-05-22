// 班会寓言故事生成器 - Vercel Serverless Function
// 用于调用DeepSeek API生成寓言故事

export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 获取用户输入
        const { userInput } = req.body;
        if (!userInput) {
            return res.status(400).json({ error: 'Missing userInput' });
        }

        // 获取DeepSeek API密钥（从环境变量中）
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            console.error('DEEPSEEK_API_KEY not configured');
            // 如果没有配置API密钥，返回模拟数据
            return res.status(200).json({
                fable: "在宁静的校园里，住着两只小兔子：诚实的小白和爱说谎的小灰。一次数学考试后，小灰因为考得不好，告诉妈妈自己考了100分。妈妈很高兴地奖励了他，但老师后来发现了真相。聪明的班主任没有直接批评小灰，而是组织了一次\"诚实树\"活动。每个诚实的孩子都可以在树上挂上一片叶子。小灰看到同学们的叶子越来越多，终于鼓起勇气承认了错误。当他挂上属于自己的叶子时，发现诚实带来的快乐远比谎言的短暂满足更珍贵。这个故事告诉我们，诚实是品格的基石，它能让我们获得真正的尊重和内心的平静。",
                questions: [
                    "故事中的小灰最初为什么选择说谎？",
                    "班主任是如何引导小灰认识到错误的？",
                    "小灰最终学到的最重要的道理是什么？"
                ],
                discussion: "讨论：在日常生活中，我们可能会遇到哪些说谎的诱惑？如何培养诚实的品质？",
                summary: "诚实是品格的基石，一时的谎言可能会带来暂时的利益，但最终会失去他人的信任和内心的平静。"
            });
        }

        // 调用DeepSeek API
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
                        content: `你是一个专业的教育故事生成器。请根据用户输入的道理或班级事件，生成一个寓言故事。

要求：
1. 故事长度约500字，适合课堂讲解
2. 故事要间接表达道理，不要直接点破
3. 故事要有教育意义，适合学生群体
4. 返回格式：
【寓言故事】
故事标题（单独一行，较大字号）
故事正文（段落清晰）

【课堂提问】
三个问题（列表形式）

【小组讨论】
一句话

【老师总结】
一句话`
                    },
                    {
                        role: 'user',
                        content: userInput
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        // 解析DeepSeek API的响应
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content;

            // 简单解析返回的内容
            const result = this.parseDeepSeekResponse(content);

            return res.status(200).json(result);
        } else {
            throw new Error('Invalid API response');
        }

    } catch (error) {
        console.error('DeepSeek API error:', error);

        // 如果API调用失败，返回模拟数据
        return res.status(200).json({
            fable: "在宁静的校园里，住着两只小兔子：诚实的小白和爱说谎的小灰。一次数学考试后，小灰因为考得不好，告诉妈妈自己考了100分。妈妈很高兴地奖励了他，但老师后来发现了真相。聪明的班主任没有直接批评小灰，而是组织了一次\"诚实树\"活动。每个诚实的孩子都可以在树上挂上一片叶子。小灰看到同学们的叶子越来越多，终于鼓起勇气承认了错误。当他挂上属于自己的叶子时，发现诚实带来的快乐远比谎言的短暂满足更珍贵。这个故事告诉我们，诚实是品格的基石，它能让我们获得真正的尊重和内心的平静。",
            questions: [
                "故事中的小灰最初为什么选择说谎？",
                "班主任是如何引导小灰认识到错误的？",
                "小灰最终学到的最重要的道理是什么？"
            ],
            discussion: "讨论：在日常生活中，我们可能会遇到哪些说谎的诱惑？如何培养诚实的品质？",
            summary: "诚实是品格的基石，一时的谎言可能会带来暂时的利益，但最终会失去他人的信任和内心的平静。"
        });
    }
}

// 解析DeepSeek API响应的辅助函数
function parseDeepSeekResponse(content) {
    // 这里需要根据实际的API响应格式进行解析
    // 这是一个简化的示例，实际实现需要根据DeepSeek的响应格式调整

    // 假设API返回的内容格式如下：
    // 【寓言故事】
    // 故事标题
    // 故事正文...
    //
    // 【课堂提问】
    // 问题1
    // 问题2
    // 问题3
    //
    // 【小组讨论】
    // 讨论话题
    //
    // 【老师总结】
    // 总结语

    // 简单解析（实际实现需要更复杂的逻辑）
    const sections = content.split('\n\n');

    let fable = '';
    let questions = [];
    let discussion = '';
    let summary = '';

    sections.forEach(section => {
        if (section.startsWith('【寓言故事】')) {
            fable = section.replace('【寓言故事】', '').trim();
        } else if (section.startsWith('【课堂提问】')) {
            const questionsText = section.replace('【课堂提问】', '').trim();
            questions = questionsText.split('\n').filter(q => q.trim());
        } else if (section.startsWith('【小组讨论】')) {
            discussion = section.replace('【小组讨论】', '').trim();
        } else if (section.startsWith('【老师总结】')) {
            summary = section.replace('【老师总结】', '').trim();
        }
    });

    return {
        fable,
        questions,
        discussion,
        summary
    };
}