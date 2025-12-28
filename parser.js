/**
 * Protocol Buffer 文本格式解析器
 * 将 Protocol Buffer 文本格式转换为 JSON 对象
 */

class ProtobufParser {
    constructor() {
        this.pos = 0;
        this.text = '';
    }

    /**
     * 解析 Protocol Buffer 文本格式
     * @param {string} text - Protocol Buffer 文本格式字符串
     * @returns {Object} 解析后的 JSON 对象
     */
    parse(text) {
        this.text = text.trim();
        this.pos = 0;
        
        try {
            const result = this.parseMessage();
            return result;
        } catch (error) {
            throw new Error(`解析错误 (位置 ${this.pos}): ${error.message}`);
        }
    }

    /**
     * 跳过空白字符
     */
    skipWhitespace() {
        while (this.pos < this.text.length && /\s/.test(this.text[this.pos])) {
            this.pos++;
        }
    }

    /**
     * 查看当前字符但不移动位置
     */
    peek() {
        this.skipWhitespace();
        return this.text[this.pos];
    }

    /**
     * 读取并返回当前字符
     */
    consume() {
        this.skipWhitespace();
        return this.text[this.pos++];
    }

    /**
     * 期望特定字符
     */
    expect(char) {
        const c = this.consume();
        if (c !== char) {
            throw new Error(`期望 '${char}' 但得到 '${c}'`);
        }
    }

    /**
     * 解析标识符（字段名）
     */
    parseIdentifier() {
        this.skipWhitespace();
        let identifier = '';
        
        while (this.pos < this.text.length) {
            const c = this.text[this.pos];
            if (/[a-zA-Z0-9_]/.test(c)) {
                identifier += c;
                this.pos++;
            } else {
                break;
            }
        }
        
        return identifier;
    }

    /**
     * 解析字符串值
     */
    parseString() {
        this.expect('"');
        let str = '';
        
        while (this.pos < this.text.length) {
            const c = this.text[this.pos];
            
            if (c === '"') {
                this.pos++;
                return str;
            } else if (c === '\\') {
                // 处理转义字符
                this.pos++;
                if (this.pos < this.text.length) {
                    str += this.text[this.pos];
                    this.pos++;
                }
            } else {
                str += c;
                this.pos++;
            }
        }
        
        throw new Error('未闭合的字符串');
    }

    /**
     * 解析数字值
     */
    parseNumber() {
        this.skipWhitespace();
        let numStr = '';
        
        // 处理负号
        if (this.text[this.pos] === '-') {
            numStr += '-';
            this.pos++;
        }
        
        while (this.pos < this.text.length) {
            const c = this.text[this.pos];
            if (/[0-9.]/.test(c)) {
                numStr += c;
                this.pos++;
            } else {
                break;
            }
        }
        
        const num = parseFloat(numStr);
        return isNaN(num) ? numStr : num;
    }

    /**
     * 解析值（可能是字符串、数字、嵌套消息或空消息）
     */
    parseValue() {
        this.skipWhitespace();
        const c = this.peek();
        
        if (c === '"') {
            return this.parseString();
        } else if (c === '<' || c === '{') {
            return this.parseNestedMessage();
        } else if (c === '-' || /[0-9]/.test(c)) {
            return this.parseNumber();
        } else {
            // 尝试解析标识符（如枚举值）
            return this.parseIdentifier();
        }
    }

    /**
     * 解析嵌套消息 <...> 或 {...}
     */
    parseNestedMessage() {
        this.skipWhitespace();
        const openChar = this.peek();
        const closeChar = openChar === '<' ? '>' : '}';
        
        this.consume(); // 消费开括号
        
        // 检查是否是空消息 <> 或 {}
        this.skipWhitespace();
        if (this.peek() === closeChar) {
            this.consume();
            return {};
        }
        
        const message = this.parseMessage(closeChar);
        this.expect(closeChar);
        return message;
    }

    /**
     * 解析消息体
     * @param {string} endChar - 结束字符，可以是 '>' 或 '}' 或 undefined（顶层消息）
     */
    parseMessage(endChar = undefined) {
        const obj = {};
        
        while (this.pos < this.text.length) {
            this.skipWhitespace();
            
            const c = this.peek();
            
            // 结束标记
            if (c === '>' || c === '}' || c === undefined) {
                // 如果指定了结束字符，检查是否匹配
                if (endChar && c !== endChar && c !== undefined) {
                    // 继续解析，可能是多字段的情况
                } else {
                    break;
                }
            }
            
            // 解析字段名
            const fieldName = this.parseIdentifier();
            if (!fieldName) {
                break;
            }
            
            this.skipWhitespace();
            const separator = this.consume();
            
            if (separator !== ':') {
                throw new Error(`期望 ':' 但得到 '${separator}'`);
            }
            
            // 解析字段值
            const value = this.parseValue();
            
            // 处理重复字段（数组）
            if (obj.hasOwnProperty(fieldName)) {
                // 如果字段已存在，转换为数组
                if (!Array.isArray(obj[fieldName])) {
                    obj[fieldName] = [obj[fieldName]];
                }
                obj[fieldName].push(value);
            } else {
                obj[fieldName] = value;
            }
        }
        
        return obj;
    }
}

/**
 * 格式化 JSON 输出
 * @param {Object} obj - JSON 对象
 * @param {number} indent - 缩进级别
 * @returns {string} 格式化后的 JSON 字符串
 */
function formatJSON(obj, indent = 2) {
    return JSON.stringify(obj, null, indent);
}

/**
 * 将 Protocol Buffer 文本格式转换为 JSON
 * @param {string} pbText - Protocol Buffer 文本格式
 * @returns {Object} 包含 success, data 或 error 的对象
 */
function convertProtobufToJSON(pbText) {
    try {
        const parser = new ProtobufParser();
        const result = parser.parse(pbText);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
