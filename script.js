class Calculator {
    constructor() {
        this.setupElements();
        this.setupVariables();
        this.setupEventListeners();
        this.loadTheme();
        this.loadHistory();
    }

    setupElements() {
        this.calculationPreview = document.querySelector('.calculation-preview');
        this.liveResult = document.querySelector('.live-result');
        this.previousOperandElement = document.querySelector('.previous-operand');
        this.currentOperandElement = document.querySelector('.current-operand');
        this.historyPanel = document.querySelector('.history-panel');
        this.historyList = document.querySelector('.history-list');
        this.historyToggle = document.querySelector('.history-toggle');
    }

    setupVariables() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.history = [];
        this.maxHistory = 15;
        this.themeIndex = 0;
        this.themes = ['default', 'dark'];
        this.isCalculating = false;
    }

    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.number').forEach(button => {
            button.addEventListener('click', () => {
                this.appendNumber(button.innerText);
                this.addButtonAnimation(button);
                this.updateLiveCalculation();
            });
        });

        // Operator buttons
        document.querySelectorAll('.operator').forEach(button => {
            button.addEventListener('click', () => {
                this.chooseOperation(button.innerText);
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
        this.historyToggle.addEventListener('click', () => this.toggleHistory());

        // History panel touch/drag handling
        let startY, currentY;
        this.historyPanel.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });

        this.historyPanel.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            if (diff > 0) { // Only allow dragging down
                this.historyPanel.style.transform = `translateY(${diff}px)`;
            }
        });

        this.historyPanel.addEventListener('touchend', () => {
            const diff = currentY - startY;
            if (diff > 100) { // If dragged down more than 100px, close panel
                this.closeHistory();
            } else {
                this.historyPanel.style.transform = '';
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    updateLiveCalculation() {
        if (this.currentOperand === '0' || this.currentOperand === 'Error') return;
        try {
            const result = this.calculateExpression();
            if (result !== undefined && result !== this.currentOperand) {
                this.liveResult.textContent = `= ${this.formatNumber(result)}`;
            } else {
                this.liveResult.textContent = '';
            }
        } catch (error) {
            this.liveResult.textContent = '';
        }
    }

    calculateExpression() {
        if (!this.previousOperand || !this.operation) return undefined;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return undefined;

        switch (this.operation) {
            case '+': return prev + current;
            case '-': return prev - current;
            case '×': return prev * current;
            case '÷': return current !== 0 ? prev / current : undefined;
            case '%': return (prev / 100) * current;
            default: return undefined;
        }
    }

    appendNumber(number) {
        if (this.currentOperand === 'Error') this.clear();
        if (number === '.' && this.currentOperand.includes('.')) return;
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand += number;
        }
        this.updateDisplay();
    }

    chooseOperation(operation) {
        if (this.currentOperand === 'Error') return;
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
        this.updateDisplay();
    }

    compute() {
        const result = this.calculateExpression();
        if (result === undefined) {
            this.currentOperand = 'Error';
        } else {
            const calculation = `${this.previousOperand} ${this.operation} ${this.currentOperand}`;
            this.currentOperand = result.toString();
            this.addToHistory(calculation, result);
        }
        this.operation = undefined;
        this.previousOperand = '';
        this.liveResult.textContent = '';
        this.updateDisplay();
    }

    addToHistory(calculation, result) {
        this.history.unshift({ calculation, result });
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
        this.updateHistoryDisplay();
        this.saveHistory();
    }

    updateHistoryDisplay() {
        this.historyList.innerHTML = this.history
            .map(item => `
                <div class="history-item slide-up" data-result="${item.result}">
                    <div class="calculation">${item.calculation}</div>
                    <div class="result">= ${this.formatNumber(item.result)}</div>
                </div>
            `)
            .join('');
    }

    formatNumber(number) {
        const stringNumber = number.toString();
        const [integerPart, decimalPart] = stringNumber.split('.');
        let formattedInteger = parseInt(integerPart).toLocaleString();
        return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    }

    toggleHistory() {
        this.historyPanel.classList.toggle('show');
    }

    closeHistory() {
        this.historyPanel.classList.remove('show');
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
            let operation = e.key;
            if (operation === '*') operation = '×';
            if (operation === '/') operation = '÷';
            this.chooseOperation(operation);
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

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.liveResult.textContent = '';
        this.updateDisplay();
    }

    delete() {
        if (this.currentOperand === 'Error') return this.clear();
        if (this.currentOperand.length === 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
        this.updateDisplay();
        this.updateLiveCalculation();
    }

    updateDisplay() {
        this.currentOperandElement.textContent = this.formatNumber(this.currentOperand);
        if (this.operation) {
            this.previousOperandElement.textContent = 
                `${this.formatNumber(this.previousOperand)} ${this.operation}`;
            this.calculationPreview.textContent = 
                `${this.formatNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.textContent = '';
            this.calculationPreview.textContent = '';
        }

        // Add animation for number changes
        this.currentOperandElement.classList.add('slide-up');
        setTimeout(() => {
            this.currentOperandElement.classList.remove('slide-up');
        }, 300);
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

    // Error handling
    showError(message) {
        this.currentOperand = 'Error';
        this.updateDisplay();
        this.currentOperandElement.classList.add('error');
        setTimeout(() => {
            this.currentOperandElement.classList.remove('error');
        }, 300);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new Calculator();

    // Handle clicks outside history panel
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.history-panel') && 
            !e.target.closest('.history-toggle') && 
            calculator.historyPanel.classList.contains('show')) {
            calculator.closeHistory();
        }
    });

    // Handle viewport height for mobile browsers
    function setViewportHeight() {
        document.documentElement.style.setProperty(
            '--vh', 
            `${window.innerHeight * 0.01}px`
        );
    }

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);

    // Prevent zoom on double tap (mobile)
    document.addEventListener('dblclick', (e) => {
        e.preventDefault();
    });

    // Add touch feedback for mobile devices
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
});
