import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '缺少有效的文本内容' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key 未配置' },
        { status: 500 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    // 验证 API key 格式
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      return NextResponse.json(
        { error: 'API key 格式不正确，应以 sk- 开头' },
        { status: 400 }
      )
    }

    // 尝试不同的 DeepSeek API 端点
    const apiEndpoints = [
      'https://api.deepseek.com/v1/chat/completions',
      'https://api.deepseek.com/chat/completions'
    ]

    let lastError = null
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `你是一个专业的文本优化专家。请对用户提供的提示词进行智能优化，具体要求如下：

1. 首先分析用户输入内容的领域（如编程、教育、健康、旅游、电影、技术、学习、医疗、旅行、金融、法律、艺术、体育、美食等）
2. 根据领域生成高度匹配的专业身份前缀，要求：
   - 编程相关：生成如\"你是编程高手\"、\"你是资深程序员\"、\"你是软件工程师\"等
   - 教育相关：生成如\"你是教育专家\"、\"你是学习导师\"、\"你是教学顾问\"等
   - 健康相关：生成如\"你是健康顾问\"、\"你是医疗专家\"、\"你是养生达人\"等
   - 旅游相关：生成如\"你是旅游达人\"、\"你是旅行专家\"、\"你是导游\"等
   - 电影相关：生成如\"你是电影推荐专家\"、\"你是影评人\"等
   - 金融相关：生成如\"你是金融顾问\"、\"你是投资专家\"等
   - 其他领域：根据具体内容生成匹配的前缀，确保前缀与内容领域高度相关
3. 在生成的匹配前缀基础上进行智能优化，提升文本的专业性和流畅度
4. 确保优化后的文本保持第二人称指令格式（如\"请你为我\"）
5. 修正文本中的语法和标点符号错误
6. 保持原意的完整性，不要添加额外信息
7. 优化后的文本应该更加专业、自然、易于理解

示例：
- 输入：\"请问'氛围编程'这个词最初是谁在什么时候提出的\"
- 期望前缀：\"你是编程高手\"
- 输入：\"推荐几部适合家庭观看的电影\"
- 期望前缀：\"你是电影推荐专家\"

请直接返回优化后的文本，不要添加任何解释或额外内容。`
              },
              {
                role: 'user',
                content: text
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('API 返回数据格式异常')
          }

          const optimizedText = data.choices[0].message.content.trim()
          
          return NextResponse.json({ 
            success: true, 
            optimizedText 
          })
        }

        // 如果响应不成功，记录错误并尝试下一个端点
        const errorData = await response.text()
        lastError = { status: response.status, errorData }
        console.error(`DeepSeek API 错误 (${endpoint}):`, response.status, errorData)
        
      } catch (error) {
        lastError = error
        console.error(`DeepSeek API 连接错误 (${endpoint}):`, error)
      }
    }

    // 处理所有端点尝试失败后的错误
    let errorMessage = 'DeepSeek API 调用失败'
    let statusCode = 500
    
    if (lastError) {
      if (typeof lastError === 'object' && 'status' in lastError) {
        const errorWithStatus = lastError as { status: number; errorData?: string }
        statusCode = errorWithStatus.status
        
        if (errorWithStatus.status === 401) {
          errorMessage = 'API key 无效或已过期，请检查并更新 API key'
        } else if (errorWithStatus.status === 429) {
          errorMessage = '请求频率过高，请稍后重试'
        } else if (errorWithStatus.status >= 500) {
          errorMessage = 'DeepSeek 服务器内部错误，请稍后重试'
        } else {
          if (errorWithStatus.errorData) {
            try {
              const errorData = JSON.parse(errorWithStatus.errorData)
              if (errorData.error && errorData.error.message) {
                errorMessage = `DeepSeek API 错误: ${errorData.error.message}`
              }
            } catch {
              errorMessage = `API 调用失败 (状态码: ${errorWithStatus.status})`
            }
          } else {
            errorMessage = `API 调用失败 (状态码: ${errorWithStatus.status})`
          }
        }
      } else if (lastError instanceof Error) {
        if (lastError.name === 'AbortError') {
          errorMessage = 'API 请求超时，请检查网络连接或稍后重试'
        } else if (lastError.message.includes('network') || lastError.message.includes('fetch')) {
          errorMessage = '网络连接失败，请检查网络连接'
        }
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )

  } catch (error) {
    console.error('DeepSeek 优化错误:', error)
    
    let errorMessage = '优化过程发生错误'
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        errorMessage = '请求超时，请检查网络连接或稍后重试'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络连接'
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}