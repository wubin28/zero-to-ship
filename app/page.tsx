'use client'

import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [optimizedTexts, setOptimizedTexts] = useState<string[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
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

  const handleOptimize = () => {
    if (!inputText.trim()) return
    
    setIsOptimizing(true)
    
    const prefix = "你是专家"
    const suffix = "请提供主要观点的3个不同出处的网页链接以便我查验。如果你不知道或查不到，就实说，不要编造"
    const optimizedText = `${prefix}${inputText}${suffix}`
    
    setTimeout(() => {
      setOptimizedTexts(prev => [optimizedText, ...prev])
      setInputText('')
      setIsOptimizing(false)
    }, 300)
  }

  useEffect(() => {
    if (optimizedTexts.length > 0 && resultsContainerRef.current) {
      resultsContainerRef.current.scrollTop = 0
    }
  }, [optimizedTexts])

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
                      #{optimizedTexts.length - index}
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
                disabled={!inputText.trim() || isOptimizing}
                className={`px-8 py-4 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform min-w-[120px] flex items-center justify-center ${
                  isOptimizing 
                    ? 'bg-orange-400 cursor-not-allowed' 
                    : !inputText.trim() 
                    ? 'bg-orange-300 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 hover:scale-105 active:scale-95'
                }`}
              >
                {isOptimizing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    优化中...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    减幻优化
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