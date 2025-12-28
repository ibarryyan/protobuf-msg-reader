/**
 * 应用主逻辑
 */

// DOM 元素
const pbInput = document.getElementById('pbInput');
const jsonOutput = document.getElementById('jsonOutput');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const copyBtn = document.getElementById('copyBtn');
const formatBtn = document.getElementById('formatBtn');

// 示例数据
const sampleData = `groups:<group_size:2 modules:<label:"alpha" module_kind:PANEL forecast_block:<> module_ref:<primary_key:9001 secondary_key:42> > > groups:<group_size:1 modules:
name:"yan" user:{age:18 addrs:"bb" email:"yan@example.com"}`;

let currentJSON = null;

/**
 * 转换 Protocol Buffer 到 JSON
 */
function convert() {
    const pbText = pbInput.value.trim();
    
    if (!pbText) {
        showError('请输入 Protocol Buffer 消息格式');
        return;
    }
    
    const result = convertProtobufToJSON(pbText);
    
    if (result.success) {
        currentJSON = result.data;
        displayJSON(currentJSON);
        copyBtn.style.display = 'inline-block';
        formatBtn.style.display = 'inline-block';
    } else {
        showError(result.error);
        copyBtn.style.display = 'none';
        formatBtn.style.display = 'none';
    }
}

/**
 * 显示 JSON 结果
 */
function displayJSON(jsonObj) {
    const formatted = formatJSON(jsonObj, 2);
    jsonOutput.innerHTML = `<pre>${escapeHtml(formatted)}</pre>`;
    jsonOutput.classList.remove('error');
}

/**
 * 显示错误信息
 */
function showError(message) {
    jsonOutput.innerHTML = `<div class="error-message">❌ ${escapeHtml(message)}</div>`;
    jsonOutput.classList.add('error');
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 复制 JSON 到剪贴板
 */
function copyToClipboard() {
    if (!currentJSON) {
        return;
    }
    
    const text = formatJSON(currentJSON, 2);
    
    // 使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('已复制到剪贴板');
        }).catch(err => {
            // 降级方案
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

/**
 * 降级复制方案
 */
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('已复制到剪贴板');
    } catch (err) {
        showNotification('复制失败，请手动复制', 'error');
    }
    
    document.body.removeChild(textarea);
}

/**
 * 显示通知消息
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

/**
 * 清空输入和输出
 */
function clear() {
    pbInput.value = '';
    jsonOutput.innerHTML = '<p class="placeholder">转换结果将显示在这里...</p>';
    currentJSON = null;
    copyBtn.style.display = 'none';
    formatBtn.style.display = 'none';
}

/**
 * 加载示例数据
 */
function loadSample() {
    pbInput.value = sampleData;
    convert();
}

/**
 * 格式化当前 JSON（切换压缩/美化）
 */
let isCompact = false;
function toggleFormat() {
    if (!currentJSON) {
        return;
    }
    
    isCompact = !isCompact;
    const formatted = isCompact ? JSON.stringify(currentJSON) : formatJSON(currentJSON, 2);
    jsonOutput.innerHTML = `<pre>${escapeHtml(formatted)}</pre>`;
    formatBtn.textContent = isCompact ? '美化' : '压缩';
}

// 事件监听
convertBtn.addEventListener('click', convert);
clearBtn.addEventListener('click', clear);
sampleBtn.addEventListener('click', loadSample);
copyBtn.addEventListener('click', copyToClipboard);
formatBtn.addEventListener('click', toggleFormat);

// 支持 Enter 键触发转换（Ctrl/Cmd + Enter）
pbInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        convert();
    }
});

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('Protocol Buffer 消息解析器已加载');
});
