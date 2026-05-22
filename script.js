// 班会寓言故事生成器 - 完整版（支持免费试用2次）
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
        // 向后端验证授权码
        const response = await fetch('/api/verifyCode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });

        const data = await response.json();
        if (data.valid) {
            localStorage.setItem('fableAuthenticated', 'true');
            localStorage.setItem('verifiedCode', code);
            localStorage.setItem('fableAuthType', 'code');
            localStorage.removeItem('fableTrialCount');
            this.checkAuthStatus();
            this.showNotification('✅ 授权码验证成功！');
        } else {
            this.showNotification('❌ 授权码无效，请重试', 'error');
        }
    } catch (error) {
        console.error('验证失败:', error);
        this.showNotification('❌ 网络错误，请稍后重试', 'error');
    }
}

    useFreeTrial() {
        // 检查是否还有试用次数
        if (this.trialCount >= 2) {
            this.showNotification('❌ 免费试用次数已用完（2次），请购买授权码', 'error');
            return;
        }

        // 增加试用次数
        this.trialCount++;
        localStorage.setItem('fableTrialCount', this.trialCount.toString());
        localStorage.setItem('fableAuthenticated', 'true');
        localStorage.setItem('fableAuthType', 'trial');
        // 清除可能存在的授权码
        localStorage.removeItem('verifiedCode');
        this.checkAuthStatus();
        this.showNotification(`✅ 免费试用 (${this.trialCount}/2) 剩余 ${2 - this.trialCount} 次`);
    }

    clearAuth() {
        localStorage.removeItem('fableAuthenticated');
        localStorage.removeItem('verifiedCode');
        localStorage.removeItem('fableAuthType');
        localStorage.removeItem('fableTrialCount');
        this.trialCount = 0;
        this.checkAuthStatus();
        this.showNotification('🔄 授权已清除，下次打开需要重新验证');
    }

    getTrialCount() {
        const count = localStorage.getItem('fableTrialCount');
        return count ? parseInt(count) : 0;
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
            this.showNotification('❌ 请先验证授权码或使用免费试用', 'error');
            return;
        }

        // 检查试用次数是否已用完
        const authType = localStorage.getItem('fableAuthType');
        if (authType === 'trial') {
            const remaining = 2 - this.trialCount;
            if (remaining <= 0) {
                this.showNotification('❌ 免费试用次数已用完，请购买授权码', 'error');
                this.clearAuth(); // 清除认证，让用户重新购买
                return;
            }
        }

        this.showLoadingState(true);
        this.generateBtn.disabled = true;

        try {
            const response = await this.callAIAPI(concept);
            this.displayResult(response);
            if (this.autoSaveCheck.checked) {
                this.saveToHistory(concept, response);
            }

            // 如果是试用用户，生成成功后再次检查次数（实际上 useFreeTrial 时已经增加，这里无需额外操作，但为了准确，重新获取）
            if (authType === 'trial') {
                this.trialCount = this.getTrialCount();
                const remaining = 2 - this.trialCount;
                if (remaining <= 0) {
                    this.showNotification('⚠️ 免费试用次数已用完，下次需要购买授权码', 'warning');
                } else {
                    this.showNotification(`✅ 故事生成成功！剩余试用次数：${remaining}`);
                }
            } else {
                this.showNotification('✅ 寓言故事生成成功！');
            }
        } catch (error) {
            let errorMsg = error.message || '生成失败，请稍后重试';
            this.showNotification(`❌ ${errorMsg}`, 'error');
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
        const authType = localStorage.getItem('fableAuthType');
        let authCode = null;
        if (authType === 'code') {
            authCode = localStorage.getItem('verifiedCode');
            if (!authCode) {
                throw new Error('未找到授权码，请重新验证');
            }
        } else if (authType === 'trial') {
            // 试用模式：后端需要识别特殊授权码？为了简单，我们仍然传递一个固定试用码，或者不传授权码
            // 但后端已经实现了授权码表，没有试用码会报无效。因此需要后端支持一个特殊的“试用”授权码。
            // 更简单的做法：试用模式不调用后端，而是使用前端模拟数据（之前的模拟故事）。但是用户要求用真AI？
            // 根据需求，免费试用应该也调用真实AI。所以需要后端支持一个通用试用码（如 "FREE_TRIAL"），
            // 并且该授权码在 auth_codes 表中总次数为 2，用完即止。
            // 为简化，我假设你已经在 Supabase 的 auth_codes 表中添加了一个 code = "FREE_TRIAL" 的记录，total_quota=2，used_count 由后端管理。
            // 如果你没有添加，试用会失败。因此需要你手动添加该记录到 Supabase。
            authCode = "FREE_TRIAL";
        } else {
            throw new Error('未知的认证类型');
        }

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userInput: concept,
                authCode: authCode
            })
        });

        if (!response.ok) {
            let errorMessage = `请求失败 (${response.status})`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // 忽略解析错误
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
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
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupEducationTheme() {
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
}

// 初始化应用
const fableGenerator = new FableGenerator();

