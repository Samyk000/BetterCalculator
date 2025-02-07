class Calculator {
    constructor() {
        this.setupElements();
        this.setupVariables();
        this.setupEventListeners();
        this.loadTheme();
        this.loadHistory();
        this.updateEmptyHistoryState();
        this.setMobileHeight();
    }

    setupElements() {
        this.calculationPreview = document.querySelector('.calculation-preview');
        this.currentOperandElement = document.querySelector('.current-operand');
        this.historyPanel = document.querySelector('.history-panel');
        this.historyList = document.querySelector('.history-list');
        this.historyToggle = document.querySelector('.history-toggle');
        this.modal = document.getElementById('clearConfirmModal');
        this.confirmClearBtn = this.modal.querySelector('.confirm-btn');
        this.cancelClearBtn = this.modal.querySelector('.cancel-btn');
        this.calculatorContainer = document.querySelector('.calculator-container');
    }

    setupVariables() {
        this.currentOperand = '0';
        this.hasDecimal = false;
        this.lastWasOperator = false;
        this.history = [];
        this.maxHistory = 50;
        this.themeIndex = 0;
        this.themes = ['default', 'dark'];
        this.expression = '';
        this.lastResult = null;
    }

    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.number').forEach(button => {
            button.addEventListener('click', () => {
                this.appendNumber(button.innerText);
                this.addButtonAnimation(button);
            });
        });

        // Operator buttons
        document.querySelectorAll('.operator').forEach(button => {
            button.addEventListener('click', () => {
                this.appendOperator(button.innerText);
                this.addButtonAnimation(button);
            });
        });

        // Equals button
        document.querySelector('.equals').addEventListener('click', () => {
            this.compute();
            this.addButtonAnimation(document.querySelector('.equals'));
        });

        // Clear button
        document.querySelector('.clear').addEventListener('click', () => {
            this.clear();
            this.addButtonAnimation(document.querySelector('.clear'));
        });

        // Delete button
        document.querySelector('.delete').addEventListener('click', () => {
            this.delete();
            this.addButtonAnimation(document.querySelector('.delete'));
        });

        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // History toggle
        this.historyToggle.addEventListener('click', () => {
            this.toggleHistory();
        });

        // Clear history
        document.querySelector('.clear-history').addEventListener('click', () => {
            this.showClearHistoryModal();
        });

        // Modal buttons
        this.confirmClearBtn.addEventListener('click', () => {
            this.clearHistory();
            this.hideClearHistoryModal();
        });

        this.cancelClearBtn.addEventListener('click', () => {
            this.hideClearHistoryModal();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Close history panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.history-panel') && 
                !e.target.closest('.history-toggle') && 
                this.historyPanel.classList.contains('show')) {
                this.closeHistory();
            }
        });

        // Window resize event
        window.addEventListener('resize', () => {
            this.setMobileHeight();
        });
    }

    appendNumber(number) {
        if (number === '.' && this.hasDecimal) return;
        if (number === '.') this.hasDecimal = true;

        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand += number;
        }

        if (!this.lastWasOperator) {
            this.expression = this.currentOperand;
        } else {
            this.expression += number;
        }

        this.lastWasOperator = false;
        this.updateDisplay();
        this.calculatePreview();
    }

    appendOperator(operator) {
        if (this.lastWasOperator) {
            this.expression = this.expression.slice(0, -1) + operator;
        } else {
            this.expression += ` ${operator} `;
        }

        this.currentOperand = this.expression;
        this.lastWasOperator = true;
        this.hasDecimal = false;
        this.updateDisplay();
        this.calculatePreview();
    }

    calculatePreview() {
        try {
            let calculation = this.expression.replace(/×/g, '*').replace(/÷/g, '/');
            calculation = calculation.replace(/%/g, '/100*');
            
            // Handle trailing operator
            if (this.lastWasOperator) {
                calculation = calculation.slice(0, -2);
            }

            const result = eval(calculation);
            
            if (result !== undefined && !isNaN(result) && isFinite(result)) {
                this.calculationPreview.textContent = `= ${this.formatNumber(result)}`;
                this.lastResult = result;
            } else {
                this.calculationPreview.textContent = '';
            }
        } catch (error) {
            this.calculationPreview.textContent = '';
        }
    }

    compute() {
        if (!this.expression || this.lastWasOperator) return;

        const calculation = this.expression;
        try {
            let result = this.lastResult;
            
            if (result !== null && !isNaN(result) && isFinite(result)) {
                this.addToHistory(calculation, result);
                this.currentOperand = this.formatNumber(result);
                this.expression = this.currentOperand;
                this.lastWasOperator = false;
                this.hasDecimal = this.currentOperand.includes('.');
                this.calculationPreview.textContent = '';
                this.updateDisplay();
            }
        } catch (error) {
            this.currentOperand = '0';
            this.expression = '';
            this.calculationPreview.textContent = '';
            this.updateDisplay();
        }
    }

    formatNumber(number) {
        let formatted = number.toString();
        if (formatted.includes('e')) {
            return Number(formatted).toFixed(8);
        }
        
        const [integerPart, decimalPart] = formatted.split('.');
        const formattedInteger = parseInt(integerPart).toLocaleString('en-US');
        
        if (decimalPart) {
            return `${formattedInteger}.${decimalPart}`;
        }
        return formattedInteger;
    }

    clear() {
        this.currentOperand = '0';
        this.expression = '';
        this.lastWasOperator = false;
        this.hasDecimal = false;
        this.lastResult = null;
        this.calculationPreview.textContent = '';
        this.updateDisplay();
    }

    delete() {
        if (this.currentOperand.length === 1) {
            this.clear();
            return;
        }

        // Remove last character
        const lastChar = this.currentOperand.slice(-1);
        if (lastChar === ' ') {
            // Remove operator and spaces
            this.currentOperand = this.currentOperand.slice(0, -3);
            this.expression = this.expression.slice(0, -3);
            this.lastWasOperator = false;
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
            this.expression = this.expression.slice(0, -1);
            if (lastChar === '.') this.hasDecimal = false;
        }

        this.updateDisplay();
        this.calculatePreview();
    }

    updateDisplay() {
        this.currentOperandElement.textContent = this.currentOperand;
    }

    addToHistory(calculation, result) {
        this.history.unshift({
            calculation,
            result: this.formatNumber(result),
            timestamp: new Date().toLocaleString()
        });

        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }

        this.updateHistoryDisplay();
        this.saveHistory();
        this.updateEmptyHistoryState();
    }

    updateHistoryDisplay() {
        this.historyList.innerHTML = this.history
            .map((item, index) => `
                <div class="history-item" data-index="${index}">
                    <div class="calculation">${item.calculation}</div>
                    <div class="result">= ${item.result}</div>
                    <div class="timestamp">${item.timestamp}</div>
                </div>
            `)
            .join('');

        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.loadHistoryItem(index);
            });
        });
    }

    loadHistoryItem(index) {
        const item = this.history[index];
        if (item) {
            this.currentOperand = item.result;
            this.expression = item.result;
            this.lastResult = parseFloat(item.result.replace(/,/g, ''));
            this.lastWasOperator = false;
            this.hasDecimal = item.result.includes('.');
            this.updateDisplay();
            this.calculationPreview.textContent = '';
            this.closeHistory();
        }
    }

    toggleHistory() {
        this.historyPanel.classList.toggle('show');
    }

    closeHistory() {
        this.historyPanel.classList.remove('show');
    }

    showClearHistoryModal() {
        this.modal.classList.add('show');
    }

    hideClearHistoryModal() {
        this.modal.classList.remove('show');
    }

    clearHistory() {
        this.history = [];
        this.updateHistoryDisplay();
        this.saveHistory();
        this.updateEmptyHistoryState();
    }

    updateEmptyHistoryState() {
        const emptyMessage = document.querySelector('.empty-history-message');
        if (this.history.length === 0) {
            emptyMessage.style.display = 'block';
            this.historyList.style.display = 'none';
        } else {
            emptyMessage.style.display = 'none';
            this.historyList.style.display = 'block';
        }
    }

    toggleTheme() {
        this.themeIndex = (this.themeIndex + 1) % this.themes.length;
        document.body.dataset.theme = this.themes[this.themeIndex];
        localStorage.setItem('calculatorTheme', this.themes[this.themeIndex]);
    }

    addButtonAnimation(button) {
        button.classList.add('button-press');
        setTimeout(() => button.classList.remove('button-press'), 200);
    }

    handleKeyboard(e) {
        if (e.key >= '0' && e.key <= '9' || e.key === '.') {
            this.appendNumber(e.key);
        } else if (['+', '-', '*', '/', '%'].includes(e.key)) {
            let operator = e.key;
            if (operator === '*') operator = '×';
            if (operator === '/') operator = '÷';
            this.appendOperator(operator);
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            this.compute();
        } else if (e.key === 'Backspace') {
            this.delete();
        } else if (e.key === 'Escape') {
            this.clear();
        } else if (e.key === 'h') {
            this.toggleHistory();
        }
    }

    setMobileHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    saveHistory() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const savedHistory = localStorage.getItem('calculatorHistory');
        if (savedHistory) {
            this.history = JSON.parse(savedHistory);
            this.updateHistoryDisplay();
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('calculatorTheme');
        if (savedTheme) {
            this.themeIndex = this.themes.indexOf(savedTheme);
            document.body.dataset.theme = savedTheme;
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new Calculator();

    // Prevent zoom on double tap (mobile)
    document.addEventListener('dblclick', (e) => {
        e.preventDefault();
    });
});
