// DeepSeek API 测试脚本
const fs = require('fs');
const path = require('path');

// 读取 .env.local 文件
let apiKey = 'your_api_key_here';
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const match = envFile.match(/DEEPSEEK_API_KEY=(.+)/);
  if (match && match[1]) {
    apiKey = match[1].trim();
  }
} catch (error) {
  console.log('⚠️  无法读取 .env.local 文件，使用默认值');
}

async function testDeepSeekAPI() {
  console.log('🔍 测试 DeepSeek API 连接...')
  console.log('API Key 格式检查:', apiKey.startsWith('sk-') ? '✅ 格式正确' : '❌ 格式错误')
  console.log('API Key 长度:', apiKey.length)
  
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.log('❌ API Key 格式不正确，应以 sk- 开头且长度足够')
    return
  }

  const endpoints = [
    'https://api.deepseek.com/v1/chat/completions',
    'https://api.deepseek.com/chat/completions'
  ]

  for (const endpoint of endpoints) {
    console.log(`\n🔗 测试端点: ${endpoint}`)
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      })

      console.log('状态码:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API 连接成功!')
        console.log('响应数据:', JSON.stringify(data, null, 2).substring(0, 200) + '...')
        return
      } else {
        const errorData = await response.text()
        console.log('❌ API 调用失败:')
        console.log('错误信息:', errorData)
      }
    } catch (error) {
      console.log('❌ 连接错误:', error.message)
    }
  }
  
  console.log('\n💡 调试建议:')
  console.log('1. 检查 API key 是否在 DeepSeek 平台有效')
  console.log('2. 确认 API key 是否有足够的权限')
  console.log('3. 检查网络连接是否正常')
  console.log('4. 确认 DeepSeek API 服务状态')
}

// 运行测试
testDeepSeekAPI().catch(console.error)