// 处理API数据
let apiData = {
    current: null,
    forecast: []
};

// 更新API数据
function updateApiData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // 设置当前数据（使用最新日期的数据）
    apiData.current = {
        date: new Date(data[0].date),
        level: data[0].hf_level,
        concentration: data[0].hf_num,
        description: data[0].hf_level,
        recommendation: data[0].content,
        color: data[0].color
    };

    // 设置预测数据（按日期排序）
    apiData.forecast = data.map(item => ({
        date: new Date(item.date),
        level: item.hf_level,
        concentration: item.hf_num,
        trend: item.percent + '%',
        color: item.color
    }))
};

// 更新当前日期
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    dateElement.textContent = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
}

// 更新当前状态
function updateCurrentStatus(data) {
    document.getElementById('current-level').textContent = data.level;
    document.getElementById('level-description').textContent = data.description;
    document.getElementById('concentration').textContent = data.concentration.toFixed(1);
    document.getElementById('recommendation').textContent = data.recommendation;
    
    // 更新颜色
    const levelElement = document.querySelector('.gradient-bg');
    if (levelElement && data.color) {
        levelElement.style.background = `linear-gradient(120deg, ${data.color} 0%, #8fd3f4 100%)`;
    }
}

// 绘制趋势图表
function drawTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date.toLocaleDateString('zh-CN', {month: 'short', day: 'numeric'})),
            datasets: [{
                label: '花粉浓度',
                data: data.map(d => d.concentration),
                borderColor: data[0].color || '#84fab0',
                backgroundColor: data[0].color ? `${data[0].color}1A` : 'rgba(132, 250, 176, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '浓度 (μg/m³)'
                    }
                }
            }
        }
    });
}

// 更新统计表格
function updateStatsTable(data) {
    const tbody = document.getElementById('stats-table');
    tbody.innerHTML = data.map(item => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${item.date.toLocaleDateString('zh-CN')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                    style="background-color: ${item.color}1A; color: ${item.color}">
                    ${item.level}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${item.concentration.toFixed(1)} μg/m³
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${item.trend}
            </td>
        </tr>
    `).join('');
}

// 初始化页面
async function initializePage() {
    try {
        // 显示加载状态
        document.body.classList.add('loading');
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        const day = String(today.getDate()).padStart(2, '0');
    
        var dateStr=`${year}${month}${day}`;
        // 调用实际API获取数据
        const response = await fetch('https://api.ztm-tech.ddns-ip.net');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.code === 200 && Array.isArray(data.result)) {
            // 更新数据
            updateApiData(data.result);
            
            // 更新UI
            updateCurrentDate();
            updateCurrentStatus(apiData.current);
            drawTrendChart(apiData.forecast);
            updateStatsTable(apiData.forecast);
        } else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('Failed to fetch data:', error);
        // 显示错误信息给用户
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = '数据加载失败，请稍后重试';
        document.body.appendChild(errorElement);
    } finally {
        // 移除加载状态
        document.body.classList.remove('loading');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializePage);