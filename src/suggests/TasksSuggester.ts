import { App, Scope } from 'obsidian';

export interface Suggestion {
    label: string;
    value: string;
    desc?: string;
}

export class TasksSuggester {
    private app: App;
    private inputEl: HTMLInputElement | HTMLTextAreaElement;
    private containerEl: HTMLElement;
    private suggestionEl: HTMLElement;
    private isOpen: boolean = false;
    private suggestions: Suggestion[] = [];
    private selectedIndex: number = 0;
    private currentTrigger: string = '';
    private scope: Scope;

    constructor(app: App, inputEl: HTMLInputElement | HTMLTextAreaElement, containerEl: HTMLElement) {
        this.app = app;
        this.inputEl = inputEl;
        this.containerEl = containerEl;
        this.scope = new Scope();

        this.suggestionEl = createDiv({ cls: 'suggestion-container' });
        this.suggestionEl.style.display = 'none';
        this.suggestionEl.style.position = 'absolute';
        this.suggestionEl.style.zIndex = '1000';
        this.containerEl.appendChild(this.suggestionEl);

        this.inputEl.addEventListener('input', this.onInput.bind(this));
        this.inputEl.addEventListener('keydown', this.onKeydown.bind(this));
        this.inputEl.addEventListener('blur', () => {
            // 延迟关闭以允许点击
            setTimeout(() => this.close(), 200);
        });
    }

    private onInput(): void {
        const cursor = this.inputEl.selectionStart || 0;
        const text = this.inputEl.value.slice(0, cursor);

        // 检查触发字符
        const lastChar = text.slice(-1); // 简单检查最后一个字符，或最后两个
        const lastTwo = text.slice(-2);

        // 优先级
        if (['🔺', '⏫', '🔼', '🔽', '⏬'].some(c => text.endsWith(c) || text.endsWith(c + ' '))) {
            // 实际上优先级通常只有一个，不需要补全，除非输入 key "priority"
            // 这里我们假设用户输入了特定的触发器，或者我们想提供替换
            // Tasks 插件通常是在输入 `priority` 后提供，或者直接输入 emoji
            // 让我们关注日期，这是最需要的自动补全
        }

        // 日期触发: 📅, ⏳, 🛫, ➕, ✅, ❌
        // 检测是否刚刚输入了这些符号，或者这些符号后面跟着空格
        // 为了简单，我们检测 " 📅" 或行首 "📅"

        const dateTriggers = ['📅', '⏳', '🛫', '➕', '✅', '❌'];
        // 查找最后一个触发器
        let triggerIndex = -1;
        let foundTrigger = '';

        for (const trigger of dateTriggers) {
            const idx = text.lastIndexOf(trigger);
            if (idx !== -1 && idx >= triggerIndex) {
                triggerIndex = idx;
                foundTrigger = trigger;
            }
        }

        if (triggerIndex !== -1) {
            // 检查光标是否在触发器之后不远的地方 (例如 10 个字符内，且没有换行)
            const distance = cursor - (triggerIndex + foundTrigger.length);
            const subText = text.slice(triggerIndex + foundTrigger.length, cursor);

            if (distance >= 0 && distance < 15 && !subText.includes('\n')) {
                this.currentTrigger = foundTrigger;
                this.showDateSuggestions(subText.trim());
                return;
            }
        }

        // 优先级建议 (如果用户输入 'priority' 或类似，这里直接简化为检测特定符号并允许更改? 
        // 或者我们实现一个通用的触发，比如输入 `[` ?)
        // 用户需求是 "输入 - [ ] 激活"，这听起来像是在描述字段拥有类似编辑器的能力

        this.close();
    }

    private onKeydown(e: KeyboardEvent): void {
        if (!this.isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
            this.renderSuggestions();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length;
            this.renderSuggestions();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.applySuggestion(this.suggestions[this.selectedIndex]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    }

    private showDateSuggestions(query: string): void {
        const today = new Date();
        const suggestions: Suggestion[] = [
            { label: 'Today', value: this.formatDate(today), desc: '今天' },
            { label: 'Tomorrow', value: this.formatDate(this.addDays(today, 1)), desc: '明天' },
            { label: 'Next Week', value: this.formatDate(this.getNextWeekDay(today, 1)), desc: '下周一' }, // 1 is Monday
            { label: 'Saturday', value: this.formatDate(this.getNextWeekDay(today, 6)), desc: '本周六' },
            { label: 'Sunday', value: this.formatDate(this.getNextWeekDay(today, 0)), desc: '本周日' },
        ];

        // 简单的过滤
        this.suggestions = suggestions.filter(s =>
            s.label.toLowerCase().includes(query.toLowerCase()) ||
            s.desc?.includes(query)
        );

        if (this.suggestions.length > 0) {
            this.open();
        } else {
            this.close();
        }
    }

    private open(): void {
        this.isOpen = true;
        this.suggestionEl.style.display = 'block';
        this.selectedIndex = 0;
        this.renderSuggestions();
        this.positionSuggestions();
    }

    private close(): void {
        this.isOpen = false;
        this.suggestionEl.style.display = 'none';
    }

    private renderSuggestions(): void {
        this.suggestionEl.empty();
        this.suggestions.forEach((s, index) => {
            const item = this.suggestionEl.createDiv({
                cls: `suggestion-item ${index === this.selectedIndex ? 'is-selected' : ''}`
            });
            item.createDiv({ cls: 'suggestion-content', text: s.label });
            if (s.desc) {
                item.createDiv({ cls: 'suggestion-aux', text: s.desc });
            }

            item.addEventListener('click', () => {
                this.applySuggestion(s);
            });

            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                // 重新渲染以更新样式（或者直接更新 DOM class）
                const items = this.suggestionEl.findAll('.suggestion-item');
                items.forEach(i => i.removeClass('is-selected'));
                item.addClass('is-selected');
            });
        });
    }

    private positionSuggestions(): void {
        // 简单定位在 input 下方
        // 更好的方法是使用 getBoundingClientRect 和 input 的光标位置
        // 这里为了简单，直接放在底部
        // 由于 modal 的 overflow，可能需要 calculation
        const rect = this.inputEl.getBoundingClientRect();
        const containerRect = this.containerEl.getBoundingClientRect();

        // 计算相对位置
        this.suggestionEl.style.top = `${this.inputEl.offsetTop + this.inputEl.offsetHeight}px`;
        this.suggestionEl.style.left = `${this.inputEl.offsetLeft}px`;
        this.suggestionEl.style.width = `${this.inputEl.offsetWidth}px`;
    }

    private applySuggestion(suggestion: Suggestion): void {
        const value = suggestion.value;
        const cursor = this.inputEl.selectionStart || 0;
        const text = this.inputEl.value;

        // 找到触发器的位置
        const upToCursor = text.slice(0, cursor);
        const triggerIndex = upToCursor.lastIndexOf(this.currentTrigger);

        if (triggerIndex !== -1) {
            const before = text.slice(0, triggerIndex + this.currentTrigger.length);
            const after = text.slice(cursor);

            // 添加空格（如果需要）
            const newValue = `${before} ${value} ${after}`;
            this.inputEl.value = newValue;

            // 移动光标
            const newCursor = triggerIndex + this.currentTrigger.length + 1 + value.length + 1;
            this.inputEl.setSelectionRange(newCursor, newCursor);

            // 触发 input 事件以通知上层更新
            this.inputEl.dispatchEvent(new Event('input'));
        }

        this.close();
    }

    // Utils
    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    private getNextWeekDay(date: Date, dayOfWeek: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
        if (result <= date) {
            result.setDate(result.getDate() + 7);
        }
        return result;
    }
}
