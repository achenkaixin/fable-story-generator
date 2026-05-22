// 班会寓言故事生成器 - 完整版
class FableGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkAuthStatus();
        this.loadHistory();
        this.setupEducationTheme();
        this.applySettings();
        this.trialCount = this.getTrialCount();
    }

    initializeElements() {
        // 授权码验证元素
        this.authSection = document.getElementById('authSection');
        this.mainContent = document.getElementById('mainContent');
        this.authCode = document.getElementById('authCode');
        this.verifyBtn = document.getElementById('verifyBtn');
        this.freeTrialBtn = document.getElementById('freeTrialBtn');
        this.clearAuthBtn = document.getElementById('clearAuthBtn');

        // 主界面元素
        this.historyBtn = document.getElementById('historyBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.historySidebar = document.getElementById('historySidebar');
        this.clearAllBtn = document.getElementById('clearAllBtn');

        // 输入区元素
        this.inputText = document.getElementById('inputText');
        this.generateBtn = document.getElementById('generateBtn');

        // 输出区元素
        this.storyContent = document.getElementById('storyContent');
        this.questionsContent = document.getElementById('questionsContent');
        this.discussionContent = document.getElementById('discussionContent');
        this.summaryContent = document.getElementById('summaryContent');
        this.wordCount = document.getElementById('wordCount');

        // 工具栏元素
        this.copyBtn = document.getElementById('copyBtn');
        this.pdfBtn = document.getElementById('pdfBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');

        // 模态框元素
        this.historyModal = document.getElementById('historyModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeHistory = document.getElementById('closeHistory');
        this.closeSettings = document.getElementById('closeSettings');

        // 历史记录元素
        this.historyList = document.getElementById('historyList');
        this.historyListModal = document.getElementById('historyListModal');

        // 设置元素
        this.themeSelect = document.getElementById('themeSelect');
        this.fontSizeSelect = document.getElementById('fontSizeSelect');
        this.autoSaveCheck = document.getElementById('autoSaveCheck');
    }

    bindEvents() {
        // 授权码验证事件
        this.verifyBtn.addEventListener('click', () => this.verifyAuthCode());
        this.freeTrialBtn.addEventListener('click', () => this.useFreeTrial());
        this.clearAuthBtn.addEventListener('click', () => this.clearAuth());

        // 主界面事件
        this.generateBtn.addEventListener('click', () => this.generateFable());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.pdfBtn.addEventListener('click', () => this.exportPDF());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.historyBtn.addEventListener('click', () => this.toggleHistorySidebar());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.clearAllBtn.addEventListener('click', () => this.clearAllHistory());

        // 模态框事件
        this.closeHistory.addEventListener('click', () => this.hideHistory());
        this.closeSettings.addEventListener('click', () => this.hideSettings());

        this.historyModal.addEventListener('click', (e) => {
            if (e.target === this.historyModal) {
                this.hideHistory();
            }
        });

        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.hideSettings();
            }
        });

        // 设置变更事件
        this.themeSelect.addEventListener('change', () => this.applyTheme());
        this.fontSizeSelect.addEventListener('change', () => this.applyFontSize());
        this.autoSaveCheck.addEventListener('change', () => this.saveSettings());

        // ESC键退出全屏
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.fullscreenElement) {
                this.toggleFullscreen();
            }
        });
    }

    checkAuthStatus() {
        const isAuthenticated = localStorage.getItem('fableAuthenticated');
        if (isAuthenticated) {
            this.authSection.style.display = 'none';
            this.mainContent.style.display = 'block';
        } else {
            this.authSection.style.display = 'block';
            this.mainContent.style.display = 'none';
        }
    }

    async verifyAuthCode() {
        const code = this.authCode.value.trim();
        if (!code) {
            this.showNotification('❌ 请输入授权码', 'error');
            return;
        }

        try {
            const response = await fetch('codes.json');
            const codes = await response.json();

            if (codes.includes(code)) {
                localStorage.setItem('fableAuthenticated', 'true');
                this.checkAuthStatus();
                this.showNotification('✅ 授权码验证成功！');
            } else {
                this.showNotification('❌ 授权码无效，请重试', 'error');
            }
        } catch (error) {
            this.showNotification('❌ 验证失败，请检查网络连接', 'error');
            console.error('Auth verification error:', error);
        }
    }

    useFreeTrial() {
        if (this.trialCount >= 3) {
            this.showNotification('❌ 免费试用次数已用完，请购买授权码', 'warning');
            return;
        }

        this.trialCount++;
        localStorage.setItem('fableTrialCount', this.trialCount.toString());
        localStorage.setItem('fableAuthenticated', 'true');
        this.checkAuthStatus();
        this.showNotification(`✅ 免费试用 (${this.trialCount}/3)`);
    }

    clearAuth() {
        localStorage.removeItem('fableAuthenticated');
        localStorage.removeItem('fableTrialCount');
        this.trialCount = 0;
        this.checkAuthStatus();
        this.showNotification('🔄 授权已清除，下次打开需要重新验证');
    }

    getTrialCount() {
        const count = localStorage.getItem('fableTrialCount');
        return count ? parseInt(count) : 0;
    }

    setupEducationTheme() {
        // 添加教育主题装饰
        const decorations = [
            { position: 'top-left', emoji: '📚' },
            { position: 'top-right', emoji: '🎓' },
            { position: 'bottom-left', emoji: '📖' },
            { position: 'bottom-right', emoji: '✏️' }
        ];

        decorations.forEach(deco => {
            const element = document.createElement('div');
            element.className = `education-decoration ${deco.position}`;
            element.textContent = deco.emoji;
            document.body.appendChild(element);
        });
    }

    applySettings() {
        const settings = this.getSettings();
        this.themeSelect.value = settings.theme;
        this.fontSizeSelect.value = settings.fontSize;
        this.autoSaveCheck.checked = settings.autoSave;
        this.applyTheme();
        this.applyFontSize();
    }

    getSettings() {
        const settings = localStorage.getItem('fableSettings');
        return settings ? JSON.parse(settings) : {
            theme: 'blue',
            fontSize: 'medium',
            autoSave: true
        };
    }

    saveSettings() {
        const settings = {
            theme: this.themeSelect.value,
            fontSize: this.fontSizeSelect.value,
            autoSave: this.autoSaveCheck.checked
        };
        localStorage.setItem('fableSettings', JSON.stringify(settings));
        this.showNotification('设置已保存');
    }

    applyTheme() {
        const theme = this.themeSelect.value;
        const root = document.documentElement;

        const themes = {
            blue: {
                '--primary-color': '#4A6FA5',
                '--secondary-color': '#6C8EBF',
                '--accent-color': '#87B7E8'
            },
            green: {
                '--primary-color': '#4CAF50',
                '--secondary-color': '#66BB6A',
                '--accent-color': '#81C784'
            },
            purple: {
                '--primary-color': '#9C27B0',
                '--secondary-color': '#BA68C8',
                '--accent-color': '#CE93D8'
            }
        };

        const selectedTheme = themes[theme];
        Object.keys(selectedTheme).forEach(key => {
            root.style.setProperty(key, selectedTheme[key]);
        });
    }

    applyFontSize() {
        const fontSize = this.fontSizeSelect.value;
        const root = document.documentElement;

        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };

        root.style.fontSize = fontSizes[fontSize];
    }

    async generateFable() {
        const concept = this.inputText.value.trim();
        if (!concept) {
            this.showNotification('❌ 请输入道理或班级事件', 'error');
            return;
        }

        if (!this.isAuthenticated()) {
            this.showNotification('❌ 请先验证授权码', 'error');
            return;
        }

        this.showLoadingState(true);
        this.generateBtn.disabled = true;

        try {
            const response = await this.callAIAPI(concept);
            this.displayResult(response);
            if (this.autoSaveCheck.checked) {
                this.saveToHistory(concept, response);
            }
            this.showNotification('✅ 寓言故事生成成功！');
        } catch (error) {
            this.showNotification('❌ 生成失败，请检查网络连接', 'error');
            console.error('Error:', error);
        } finally {
            this.showLoadingState(false);
            this.generateBtn.disabled = false;
        }
    }

    isAuthenticated() {
        return localStorage.getItem('fableAuthenticated') === 'true';
    }

    async callAIAPI(concept) {
        // 通过Vercel Serverless Function调用AI
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userInput: concept })
            });

            if (!response.ok) {
                throw new Error('AI API调用失败');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('AI API error:', error);
            // 如果API调用失败，使用模拟数据
            return this.generateEducationalFable(concept);
        }
    }

    generateEducationalFable(concept) {
        // 根据不同概念生成不同的教育主题寓言
        const fables = {
            '不撒谎': `在宁静的校园里，住着两只小兔子：诚实的小白和爱说谎的小灰。一次数学考试后，小灰因为考得不好，告诉妈妈自己考了100分。妈妈很高兴地奖励了他，但老师后来发现了真相。聪明的班主任没有直接批评小灰，而是组织了一次"诚实树"活动。每个诚实的孩子都可以在树上挂上一片叶子。小灰看到同学们的叶子越来越多，终于鼓起勇气承认了错误。当他挂上属于自己的叶子时，发现诚实带来的快乐远比谎言的短暂满足更珍贵。这个故事告诉我们，诚实是品格的基石，它能让我们获得真正的尊重和内心的平静。`,

            '值日': `在整洁的教室里，值日生小明总是忘记打扫卫生。一天，班级的"卫生监督员"小花发现教室很脏，但没有直接批评小明，而是悄悄地画了一张"教室清洁地图"，标注了需要打扫的地方。第二天，小明看到地图后感到很羞愧，主动承担了值日工作。从此，他不仅认真值日，还帮助其他同学。这个故事告诉我们，责任意识是成长的重要品质，勇于承担责任能让我们成为更好的自己。`,

            '合作': `在运动会上，两个班级要进行拔河比赛。三班的小明和小红一开始各自为战，结果总是输。后来，他们在老师的指导下学会了配合：小明负责拉绳子，小红负责协调节奏。当他们团结协作时，竟然战胜了强大的对手。这个故事告诉我们，团队合作的力量远大于个人努力，学会合作是成功的关键。`,

            '尊重': `在图书馆里，小刚总是大声说话，影响其他同学。图书管理员没有直接批评他，而是给他讲了一个"声音的旅行"故事：声音就像小精灵，在安静的地方会变得温柔，在嘈杂的地方会变得暴躁。小刚听后明白了，尊重他人的空间就是尊重自己。这个故事告诉我们，尊重是相互的，善待他人就是善待自己。`
        };

        // 默认寓言故事
        const defaultFable = `在一片宁静的森林学校里，住着两只松鼠学生：勤奋的小灰和懒惰的小棕。小灰总是认真完成作业，而小棕却喜欢抄袭。一天，森林老师布置了收集橡子的作业，小棕为了省事，把小灰的作业本偷走了。森林里的动物们开始议论纷纷，小灰感到很委屈。聪明的猫头鹰校长发现了真相，它没有直接批评小棕，而是组织了一场"橡子收集大赛"。在比赛中，小棕因为没有认真练习，输给了小灰。他终于明白，只有通过自己的努力才能获得真正的成功。这个故事告诉我们，诚实和努力是学习的基础，抄袭只会带来暂时的便利，最终会失去真正的收获。`;

        const fable = fables[concept] || defaultFable;

        // 生成教育相关的提问和讨论
        const questions = this.generateEducationalQuestions(concept);
        const discussion = this.generateDiscussionTopic(concept);
        const summary = this.generateTeacherSummary(concept);

        return {
            fable,
            questions,
            discussion,
            summary
        };
    }

    generateEducationalQuestions(concept) {
        const questionSets = {
            '不撒谎': [
                `故事中的小灰最初为什么选择说谎？`,
                `班主任是如何引导小灰认识到错误的？`,
                `小灰最终学到的最重要的道理是什么？`
            ],
            '值日': [
                `小明一开始对待值日工作的态度是怎样的？`,
                `小花是如何帮助小明认识到责任的？`,
                `从故事中我们可以学到关于责任感的哪些启示？`
            ],
            '合作': [
                `小明和小红一开始为什么总是失败？`,
                `他们后来是如何改变合作方式的？`,
                `这个故事对我们班级合作有什么启发？`
            ],
            '尊重': [
                `小刚在图书馆的行为有什么问题？`,
                `图书管理员是如何教育小刚的？`,
                `尊重他人具体体现在哪些方面？`
            ]
        };

        return questionSets[concept] || [
            `故事中的主要角色遇到了什么问题？`,
            `故事中的智慧角色是如何解决问题的？`,
            `这个故事给我们的教育意义是什么？`
        ];
    }

    generateDiscussionTopic(concept) {
        const topics = {
            '不撒谎': `讨论：在日常生活中，我们可能会遇到哪些说谎的诱惑？如何培养诚实的品质？`,
            '值日': `讨论：作为班级成员，我们应该如何承担自己的责任？分享一次你认真完成任务的经历。`,
            '合作': `讨论：在小组活动中，如何才能更好地合作？请举例说明有效的合作方法。`,
            '尊重': `讨论：尊重他人包括哪些具体行为？如何在校园生活中体现尊重？`
        };

        return topics[concept] || `讨论：这个故事给我们的教育启示是什么？请结合自己的经历分享。`;
    }

    generateTeacherSummary(concept) {
        const summaries = {
            '不撒谎': `诚实是品格的基石，一时的谎言可能会带来暂时的利益，但最终会失去他人的信任和内心的平静。`,
            '值日': `责任意识是成长的重要品质，勇于承担责任能让我们成为更有担当的人。`,
            '合作': `团队合作的力量远大于个人努力，学会合作是成功的关键，也是我们成长的重要一课。`,
            '尊重': `尊重是相互的，善待他人就是善待自己，良好的品格从尊重开始。`
        };

        return summaries[concept] || `这个故事告诉我们重要的道理，希望大家能从中获得启发，成为更好的自己。`;
    }

    displayResult(response) {
        // 计算字数
        const wordCount = response.fable.length;
        this.wordCount.textContent = `约 ${wordCount} 字`;

        // 添加动画效果
        this.storyContent.style.opacity = '0';
        this.questionsContent.style.opacity = '0';
        this.discussionContent.style.opacity = '0';
        this.summaryContent.style.opacity = '0';

        setTimeout(() => {
            this.storyContent.innerHTML = `<p>${response.fable}</p>`;
            this.questionsContent.innerHTML = response.questions.map(q =>
                `<p>• ${q}</p>`
            ).join('');
            this.discussionContent.innerHTML = `<p>${response.discussion}</p>`;
            this.summaryContent.innerHTML = `<p>${response.summary}</p>`;

            // 淡入动画
            this.storyContent.style.opacity = '1';
            this.questionsContent.style.opacity = '1';
            this.discussionContent.style.opacity = '1';
            this.summaryContent.style.opacity = '1';
        }, 100);
    }

    saveToHistory(concept, response) {
        const history = this.getHistory();
        const newItem = {
            id: Date.now(),
            concept,
            fable: response.fable,
            questions: response.questions,
            discussion: response.discussion,
            summary: response.summary,
            timestamp: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        history.unshift(newItem);
        localStorage.setItem('fableHistory', JSON.stringify(history));
        this.updateHistoryDisplay();
    }

    getHistory() {
        const history = localStorage.getItem('fableHistory');
        return history ? JSON.parse(history) : [];
    }

    loadHistory() {
        const history = this.getHistory();
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const history = this.getHistory();
        this.historyList.innerHTML = history.map(item => `
            <div class="history-item" onclick="fableGenerator.loadHistoryItem(${item.id})">
                <h3>${item.concept}
                    <span class="history-time">${item.timestamp}</span>
                </h3>
                <p><strong>故事：</strong>${item.fable.substring(0, 60)}...</p>
                <div class="btn-group">
                    <button class="btn small" onclick="event.stopPropagation(); fableGenerator.loadHistoryItem(${item.id})">加载</button>
                    <button class="btn delete-btn" onclick="event.stopPropagation(); fableGenerator.deleteHistory(${item.id})">删除</button>
                </div>
            </div>
        `).join('');

        this.historyListModal.innerHTML = this.historyList.innerHTML;
    }

    showHistory() {
        this.historySidebar.classList.add('open');
    }

    hideHistory() {
        this.historySidebar.classList.remove('open');
        this.historyModal.style.display = 'none';
    }

    toggleHistorySidebar() {
        this.historySidebar.classList.toggle('open');
    }

    loadHistoryItem(id) {
        const history = this.getHistory();
        const item = history.find(h => h.id === id);
        if (item) {
            this.inputText.value = item.concept;
            this.displayResult(item);
            this.hideHistory();
        }
    }

    deleteHistory(id) {
        const history = this.getHistory();
        const newHistory = history.filter(item => item.id !== id);
        localStorage.setItem('fableHistory', JSON.stringify(newHistory));
        this.updateHistoryDisplay();
        this.showNotification('✅ 历史记录已删除');
    }

    clearAllHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            localStorage.removeItem('fableHistory');
            this.updateHistoryDisplay();
            this.showNotification('✅ 所有历史记录已清空');
        }
    }

    showSettings() {
        this.settingsModal.style.display = 'block';
    }

    hideSettings() {
        this.settingsModal.style.display = 'none';
    }

    copyToClipboard() {
        const content = `
📚 班会寓言故事生成器 - 教学材料

【寓言故事】
${this.storyContent.textContent}

【课堂提问】
${this.questionsContent.textContent}

【小组讨论话题】
${this.discussionContent.textContent}

【老师总结语】
${this.summaryContent.textContent}

生成时间：${new Date().toLocaleString()}
        `;

        navigator.clipboard.writeText(content).then(() => {
            this.showNotification('✅ 教学材料已复制到剪贴板');
        }).catch(() => {
            this.showNotification('❌ 复制失败，请重试', 'error');
        });
    }

    exportPDF() {
        this.showNotification('📄 PDF导出功能开发中...');
        // 实际实现需要引入jsPDF库
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> 退出全屏';
            document.body.classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> 全屏';
            document.body.classList.remove('fullscreen');
        }
    }

    showLoadingState(isLoading) {
        if (isLoading) {
            this.generateBtn.innerHTML = '<span class="loading"></span> 生成中...';
        } else {
            this.generateBtn.innerHTML = '<span class="btn-icon">✨</span> 生成寓言故事';
        }
    }

    showNotification(message, type = 'success') {
        // 创建更友好的通知
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 初始化应用
const fableGenerator = new FableGenerator();