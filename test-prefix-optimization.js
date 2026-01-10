// 测试减幻前缀优化功能
const testCases = [
  {
    input: "请问'氛围编程'这个词最初是谁在什么时候提出的",
    expectedPrefix: "你是编程高手"
  },
  {
    input: "推荐几部适合家庭观看的电影",
    expectedPrefix: "你是电影推荐专家"
  },
  {
    input: "如何提高英语学习效率",
    expectedPrefix: "你是教育专家"
  },
  {
    input: "最近有什么好的旅游目的地推荐",
    expectedPrefix: "你是旅游达人"
  },
  {
    input: "怎样保持健康的生活方式",
    expectedPrefix: "你是健康顾问"
  }
]

async function testPrefixOptimization() {
  console.log('🧪 测试减幻前缀领域匹配功能\n')
  
  for (const testCase of testCases) {
    console.log(`📝 测试输入: "${testCase.input}"`)
    console.log(`🎯 期望前缀: "${testCase.expectedPrefix}"`)
    
    try {
      const response = await fetch('http://localhost:3000/api/deepseek-optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testCase.input }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const optimizedText = data.optimizedText
        
        // 检查是否包含期望的前缀
        const hasExpectedPrefix = optimizedText.includes(testCase.expectedPrefix)
        
        console.log(`✅ API响应成功`)
        console.log(`📄 优化后文本: "${optimizedText}"`)
        console.log(`🔍 前缀匹配: ${hasExpectedPrefix ? '✅ 匹配成功' : '❌ 匹配失败'}`)
        
        if (!hasExpectedPrefix) {
          // 检查实际生成的前缀
          const prefixMatch = optimizedText.match(/^你是[^，。！？]+/)
          if (prefixMatch) {
            console.log(`📋 实际前缀: "${prefixMatch[0]}"`)
          }
        }
      } else {
        const errorData = await response.text()
        console.log(`❌ API响应失败: ${response.status}`)
        console.log(`📋 错误信息: ${errorData}`)
      }
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`)
    }
    
    console.log('---\n')
  }
}

// 运行测试
testPrefixOptimization().catch(console.error)