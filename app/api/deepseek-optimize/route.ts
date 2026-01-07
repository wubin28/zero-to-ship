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

    const response = await fetch('https://api.deepseek.com/chat/completions', {
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

1. 根据提示词内容，将通用表述"你是专家"动态替换为相应领域的专业身份
2. 对语句进行流畅性优化，提升文本表达的自然度和专业性
3. 修正文本中的标点符号使用错误，确保符合标准中文标点规范
4. 保持原意的完整性，不要添加额外信息
5. 优化后的文本应该更加专业、流畅、易于理解

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

    if (!response.ok) {
      const errorData = await response.text()
      console.error('DeepSeek API 错误:', response.status, errorData)
      
      let errorMessage = 'API 调用失败'
      if (response.status === 401) {
        errorMessage = 'API key 无效'
      } else if (response.status === 429) {
        errorMessage = '请求频率过高，请稍后重试'
      } else if (response.status >= 500) {
        errorMessage = '服务器内部错误，请稍后重试'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API 返回数据格式异常')
    }

    const optimizedText = data.choices[0].message.content.trim()
    
    return NextResponse.json({ 
      success: true, 
      optimizedText 
    })

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