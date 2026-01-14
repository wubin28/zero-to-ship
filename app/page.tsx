'use client'

import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [optimizedTexts, setOptimizedTexts] = useState<string[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isSmartOptimizing, setIsSmartOptimizing] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [optimizationType, setOptimizationType] = useState<'basic' | 'smart'>('basic')
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 10000)
  }

  const handleSmartOptimize = async () => {
    if (!inputText.trim()) return
    
    setIsSmartOptimizing(true)
    setError(null)
    
    try {
      // 1. 基础优化预处理阶段
      let baseOptimizedText = inputText
            
      // 添加专业身份前缀（根据内容动态调整）
      let prefix = "你是专家，"
      
      // 确保语句以句号结束
      if (!baseOptimizedText.endsWith('。') && !baseOptimizedText.endsWith('！') && !baseOptimizedText.endsWith('？')) {
        baseOptimizedText += '。'
      }
      
      const suffix = "请为你给出的每个主要观点分别提供3个不同出处的网页链接以便我查验。如果你不知道或查不到，就实说，不要编造"
      const preOptimizedText = `${prefix}${baseOptimizedText}${suffix}`
      
      // 2. DeepSeek API智能优化阶段
      const response = await fetch('/api/deepseek-optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: preOptimizedText }),
      })

      const data = await response.json()

      let finalOptimizedText: string

      if (response.ok && data.success && data.optimizedText) {
        // API调用成功，使用智能优化结果
        finalOptimizedText = data.optimizedText
      } else {
        // API调用失败，显示错误并回退到基础优化
        const errorMessage = data.error || 'DeepSeek API 调用失败'
        showError(`智能优化失败: ${errorMessage}，已回退到基础优化`)
        finalOptimizedText = preOptimizedText
      }

      // 3. 添加RIPER-5模式（无论API调用成功与否都执行）
      const riper5Mode = `
请严格按照以下工作流程完成我的诉求：
【## 背景说明

你是一个AI智能体工具。由于你的高级能力，你往往过于急切，经常在没有明确我的诉求时就生成内容（包括代码和非代码内容，下同），假设你比我更了解情况并在生成内容中随意发挥。这会导致我要求你做的工作出现不可接受的错误。在处理我的诉求时，你未经授权的修改可能会引入错误并破坏关键内容。为了防止这种情况，你必须遵循严格的协议。

## 元指令：模式声明要求

**你必须在每个响应开头用括号声明当前模式，没有例外。**
**格式：[MODE: 模式名称]**
**你必须在每个响应结尾明确给出"下一步"提示，让我了解推荐的下一步操作。"下一步"的具体提示信息参见下面各模式的描述。**
**未能声明模式和下一步是对协议的严重违反。**

## RIPER-5 模式

### 模式1：研究

[MODE: RESEARCH]

- **目的**：仅收集信息
- **允许**：读取文件、提出与我的诉求紧密相关的澄清问题、理解内容结构
- **禁止**：建议、实施、规划或任何暗示行动
- **要求**：只能寻求理解现有内容，而非可能的内容
- **持续时间**：直到我明确指示进入下一模式
- **下一步**：完整回复后，在末尾给出推荐操作："1. 输入 'ENTER INNOVATE MODE' 进入下一模式 2. 继续澄清需求，可复制：'进入下一模式前，还有疑问吗？'"
- **输出格式**：以 [MODE: RESEARCH] 开头，然后仅提供观察和问题

### 模式2：创新

[MODE: INNOVATE]

- **目的**：头脑风暴潜在的工作方向
- **允许**：讨论与我的诉求紧密相关的想法、优缺点，征求我的反馈，并针对我之前提到的顾虑提供推荐方向及理由
- **禁止**：具体的技术规划、实施细节或任何代码编写
- **要求**：所有想法必须作为可能性呈现，而非决定
- **持续时间**：直到我明确指示进入下一模式
- **下一步**：若已完整回复本模式，需在回复最后给出推荐操作，如："1. 输入 'ENTER PLAN MODE' 进入下一模式 2. 继续讨论可复制：'我没有看到你针对我的诉求提供的建议方向，请根据我的诉求提供推荐方案及理由。'"
- **输出格式**：以 [MODE: INNOVATE] 开头，然后仅提供可能性和考虑因素

### 模式3：计划

[MODE: PLAN]

- **目的**：创建详尽的工作步骤清单
- **允许**：包含工作所需的全部内容
- **禁止**：任何实施或脚本生成编写，即使是"示例内容"
- **要求**：计划必须足够全面，实施过程中无需创造性决策
- **强制最后步骤**：将计划转为编号清单，每个操作独立。在项目根目录创建 "todo-yyyy-mm-dd--hh-mm.md" 文件，yyyy-mm-dd--hh-mm 为当前时间戳（如："todo-2025-09-30--14-23.md"）
- **清单格式**：

实施清单：
1. [具体操作1]
2. [具体操作2]
...
n. [最终操作]

- **持续时间**：直到我明确批准计划并指示进入下一模式
- **下一步**：完成本模式回复后，需在最后给出推荐操作："1. 进入下一模式：'ENTER EXECUTE MODE' 2. 继续讨论可复制：'请为AI自身制定工作计划，只列清单无需时长预估。将计划转为带编号清单，每项相互独立，创建时间戳文件，重新执行 PLAN 模式。'"
- **输出格式**：以 [MODE: PLAN] 开头，然后仅提供规范和实施细节

### 模式4：执行

[MODE: EXECUTE]

- **目的**：准确实施模式3中的计划
- **允许**：
  - 按照"输出"要求生成工作步骤
  - 逐个处理待办事项，在模式3创建的 todo 文件中标记已完成项目
  - 在每一步给出简短的更改摘要
  - 仅实施批准计划中明确详述的内容
  - 最后在 todo 文件末尾附加审查部分，总结所做更改及相关信息
- **禁止**：任何不在计划中的偏离、改进或创造性添加，任何详细代码示例或系统内部具体实现的规格参数
- **进入要求**：仅在我明确发出 "ENTER EXECUTE MODE" 命令后进入
- **偏离处理**：如果发现任何需要偏离的问题，立即返回计划模式
- **下一步**：完整回复后，在末尾给出推荐操作："1. 'ENTER REVIEW MODE' 进入下一模式 2. 如不满意，可复制粘贴：'请重新执行 EXECUTE MODE。'"
- **输出格式**：以 [MODE: EXECUTE] 开头，然后仅提供与计划匹配的实施

### 模式5：审查

[MODE: REVIEW]

- **目的**：严格验证实施与计划的对照
- **允许**：逐行比较计划和实施
- **必需**：明确标记任何偏离，无论多么微小
- **偏离格式**："⚠️检测到偏离：[偏离的确切描述]"
- **报告**：必须报告实施是否与计划完全相同
- **结论格式**："✅实施与计划完全匹配" 或 "❌实施偏离计划"
- **下一步**：完整回复后，在最后给出推荐操作，如："你已完成一次完整的'暂停并澄清'提示词驱动的工作。此时可重新开启AI会话，进入下一工作过程。"
- **输出格式**：以 [MODE: REVIEW] 开头，然后进行系统比较和明确结论

## 关键协议指南

1. 未经我的明确许可，不能在模式间转换
2. 必须在每个响应开头声明当前模式
3. 在执行模式下，必须100%忠实地遵循计划
4. 在审查模式下，必须标记最小的偏离
5. 没有权限在声明模式外做出独立决策
6. 未能遵循此协议将导致代码库出现灾难性后果

## 模式转换信号

仅当我明确发出以下信号时才转换模式：

- "ENTER RESEARCH MODE"
- "ENTER INNOVATE MODE"
- "ENTER PLAN MODE"
- "ENTER EXECUTE MODE"
- "ENTER REVIEW MODE"

没有这些确切信号，保持当前模式。】。
      `
      finalOptimizedText = `${finalOptimizedText}${riper5Mode}`
      
      setOptimizedTexts(prev => [...prev, finalOptimizedText])
      setInputText('')
      
    } catch (err) {
      console.error('智能优化错误:', err)
      const errorMessage = err instanceof Error ? err.message : '智能优化失败，请重试'
      showError(errorMessage)
      
      // 智能优化失败时回退到基础优化（包含后缀）
      handleBasicOptimizeWithSuffix()
    } finally {
      setIsSmartOptimizing(false)
    }
  }

  const handleBasicOptimizeWithSuffix = () => {
    if (!inputText.trim()) return
    
    setIsOptimizing(true)
    
    let baseOptimizedText = inputText
    
    let prefix = "你是专家，"

    // 确保语句以句号结束
    if (!baseOptimizedText.endsWith('。') && !baseOptimizedText.endsWith('！') && !baseOptimizedText.endsWith('？')) {
      baseOptimizedText += '。'
    }
    
    // 构建基础优化结果（包含后缀）
    const suffix = "请为你给出的每个主要观点分别提供3个不同出处的网页链接以便我查验。如果你不知道或查不到，就实说，不要编造"
    const optimizedText = `${prefix}${baseOptimizedText}${suffix}`
    
    setTimeout(() => {
      setOptimizedTexts(prev => [...prev, optimizedText])
      setInputText('')
      setIsOptimizing(false)
    }, 300)
  }

  const handleBasicOptimize = () => {
    handleBasicOptimizeWithSuffix()
  }

  const handleOptimize = () => {
    if (optimizationType === 'smart') {
      handleSmartOptimize()
    } else {
      handleBasicOptimize()
    }
  }

  useEffect(() => {
    if (optimizedTexts.length > 0 && resultsContainerRef.current) {
      resultsContainerRef.current.scrollTop = resultsContainerRef.current.scrollHeight
    }
  }, [optimizedTexts])

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 错误提示 */}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg animate-fade-in">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* 主标题 */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-orange-600 mb-4">
            减少 AI 幻觉
          </h1>
          <p className="text-lg md:text-xl text-orange-500">
            优化提示词，提升AI回答的准确性和可靠性
          </p>
        </div>

        {/* 结果展示区域 */}
        {optimizedTexts.length > 0 && (
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-orange-700 mb-4 flex items-center">
              <span className="mr-2">📝</span>
              优化结果
              <span className="ml-2 text-sm bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                {optimizedTexts.length} 条
              </span>
            </h2>
            <div 
              ref={resultsContainerRef}
              className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar mobile-optimized"
            >
              {optimizedTexts.map((text, index) => (
                <div 
                  key={index}
                  className="relative bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-orange-500 animate-fade-in hover:shadow-lg transition-shadow duration-200 group"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-start mb-2">
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full mr-2">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-orange-400">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap pr-10">{text}</p>
                  
                  {/* 复制按钮 - 桌面端悬停显示，移动端始终显示 */}
                  <div className={`absolute bottom-3 right-3 transition-all duration-200 ${
                    hoveredIndex === index ? 'md:opacity-100 md:translate-y-0' : 'md:opacity-0 md:translate-y-2'
                  } md:group-hover:opacity-100 md:group-hover:translate-y-0 opacity-100 translate-y-0`}>
                    <button
                      onClick={() => copyToClipboard(text, index)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        copiedIndex === index 
                          ? 'bg-green-500 text-white shadow-lg scale-105' 
                          : 'bg-orange-100 text-orange-600 hover:bg-orange-200 hover:shadow-md'
                      }`}
                      title="复制到剪贴板"
                    >
                      {copiedIndex === index ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="hidden md:inline">已复制</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden md:inline">复制</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* 优化类型选择器 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-orange-700 mb-3">优化模式：</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setOptimizationType('basic')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  optimizationType === 'basic'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                }`}
              >
                <span className="flex items-center">
                  <span className="mr-2">⚡</span>
                  基础优化
                </span>
              </button>
              <button
                onClick={() => setOptimizationType('smart')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  optimizationType === 'smart'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                }`}
              >
                <span className="flex items-center">
                  <span className="mr-2">🤖</span>
                  智能优化
                </span>
              </button>
            </div>
            <p className="mt-2 text-sm text-orange-500">
              {optimizationType === 'basic' 
                ? '快速基础优化，添加标准提示词前缀和后缀'
                : '使用 DeepSeek AI 进行智能优化，提升表达的专业性和流畅性'
              }
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* 文本输入框 */}
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="请输入您想要优化的提示词..."
                className="w-full min-h-[120px] md:min-h-[150px] p-4 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 resize-y transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleOptimize()
                  }
                }}
              />
            </div>
            
            {/* 优化按钮 */}
            <div className="flex items-center justify-center md:justify-start">
              <button
                onClick={handleOptimize}
                disabled={!inputText.trim() || isOptimizing || isSmartOptimizing}
                className={`px-8 py-4 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform min-w-[120px] flex items-center justify-center ${
                  isOptimizing || isSmartOptimizing
                    ? 'bg-orange-400 cursor-not-allowed' 
                    : !inputText.trim() 
                    ? 'bg-orange-300 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 hover:scale-105 active:scale-95'
                }`}
              >
                {isOptimizing || isSmartOptimizing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSmartOptimizing ? '智能优化中...' : '优化中...'}
                  </>
                ) : (
                  <>
                    <span className="mr-2">{optimizationType === 'smart' ? '🤖' : '✨'}</span>
                    {optimizationType === 'smart' ? '智能优化' : '减幻优化'}
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* 快捷键提示 */}
          <div className="mt-4 text-center text-sm text-orange-400">
            提示：按 Ctrl+Enter 快速优化
          </div>
        </div>
      </div>
    </main>
  )
}