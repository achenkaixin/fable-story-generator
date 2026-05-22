// 班会寓言故事生成器 - Vercel Serverless Function
export default async function handler(req, res) {
    console.log('=== API请求开始 ===');
    console.log('请求方法:', req.method);
    console.log('环境变量 DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '存在' : '缺失');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userInput } = req.body;
        console.log('用户输入:', userInput);

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            console.log('❌ API密钥缺失，返回测试信息');
            return res.status(200).json({
                fable: "【调试信息】API密钥缺失。请检查 Vercel 环境变量 DEEPSEEK_API_KEY 是否正确配置。",
                questions: ["环境变量是否添加？", "变量名是否为 DEEPSEEK_API_KEY？", "是否重新部署？"],
                discussion: "请检查项目 Settings → Environment Variables",
                summary: "API 密钥未配置"
            });
        }

        console.log('✅ API密钥存在，开始调用 DeepSeek API...');
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是一个寓言作家，根据用户输入创作一个短小的寓言故事（300字左右）。' },
                    { role: 'user', content: userInput }
                ],
                temperature: 0.7,
                max_tokens: 800
            })
        });

        console.log('DeepSeek API 响应状态:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API 错误响应:', errorText);
            return res.status(500).json({ error: `DeepSeek API error: ${response.status}` });
        }

        const data = await response.json();
        console.log('✅ API 调用成功，返回内容长度:', data.choices[0].message.content.length);
        const content = data.choices[0].message.content;

        // 简单解析（先保证能返回故事）
        return res.status(200).json({
            fable: content,
            questions: ["故事里的主角遇到了什么问题？", "他是怎么解决的？", "你学到了什么？"],
            discussion: "分组讨论这个故事和我们班的联系。",
            summary: "道理藏在故事里，用心体会。"
        });
    } catch (error) {
        console.error('❌ 函数执行错误:', error);
        return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
}
