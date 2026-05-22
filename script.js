async function generateStory() {
    // 获取用户输入（根据你实际的输入框 ID 修改）
    const userInput = document.getElementById('storyPrompt').value;  // 如果你的输入框 id 是 'storyPrompt'，否则改成正确的
    // 从 localStorage 获取验证过的授权码
    const authCode = localStorage.getItem('verifiedCode');

    if (!userInput) {
        alert('请输入道理或班级事件');
        return;
    }
    if (!authCode) {
        alert('请先验证授权码');
        return;
    }

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userInput: userInput,
                authCode: authCode
            })
        });

        const data = await response.json();
        if (response.ok) {
            // 假设你的结果显示区域有这些 id，请根据实际修改
            document.getElementById('storyResult').innerText = data.fable;
            // 如果你的页面有专门显示提问、讨论、总结的位置，可以类似赋值
            // document.getElementById('questions').innerText = data.questions.join('\n');
            // document.getElementById('discussion').innerText = data.discussion;
            // document.getElementById('summary').innerText = data.summary;
        } else {
            alert(data.error || '生成失败');
        }
    } catch (error) {
        console.error('请求错误:', error);
        alert('网络错误，请稍后重试');
    }
}
