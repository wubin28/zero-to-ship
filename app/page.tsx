'use client'

import { useEffect, useRef, useState } from 'react'
import { buildAssumptionExamAndGrillingPrompt } from '../lib/prompt-templates.mjs'

type OptimizationType = 'basic' | 'assumption-exam-and-grilling'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [optimizedTexts, setOptimizedTexts] = useState<string[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationType, setOptimizationType] = useState<OptimizationType>('basic')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  const isGrilling = optimizationType === 'assumption-exam-and-grilling'

  const addResult = (text: string) => {
    setTimeout(() => {
      setOptimizedTexts((previous) => [...previous, text])
      setInputText('')
      setIsOptimizing(false)
    }, 300)
  }

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleOptimize = () => {
    if (!inputText.trim()) return
    setIsOptimizing(true)

    if (isGrilling) {
      addResult(buildAssumptionExamAndGrillingPrompt(inputText))
      return
    }

    let prompt = inputText
    if (!prompt.endsWith('。') && !prompt.endsWith('！') && !prompt.endsWith('？')) prompt += '。'
    addResult(`你是专家，${prompt}请为你给出的每个主要观点分别提供3个不同出处的网页链接以便我查验。如果你不知道或查不到，就实说，不要编造`)
  }

  useEffect(() => {
    if (optimizedTexts.length > 0 && resultsContainerRef.current) {
      resultsContainerRef.current.scrollTop = resultsContainerRef.current.scrollHeight
    }
  }, [optimizedTexts])

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-orange-600 mb-4">减少 AI 幻觉</h1>
          <p className="text-lg md:text-xl text-orange-500">优化提示词，提升AI回答的准确性和可靠性</p>
        </header>

        {optimizedTexts.length > 0 && (
          <section className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-orange-700 mb-4">📝 优化结果 <span className="text-sm bg-orange-100 text-orange-600 px-2 py-1 rounded-full">{optimizedTexts.length} 条</span></h2>
            <div ref={resultsContainerRef} className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar mobile-optimized">
              {optimizedTexts.map((text, index) => (
                <article key={index} className="relative bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-orange-500">
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">#{index + 1}</span>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap pr-10 mt-2">{text}</p>
                  <button onClick={() => copyToClipboard(text, index)} className="absolute bottom-3 right-3 px-3 py-2 rounded-lg text-sm font-medium bg-orange-100 text-orange-600 hover:bg-orange-200">{copiedIndex === index ? '已复制' : '复制'}</button>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <label className="block text-sm font-medium text-orange-700 mb-3">优化模式：</label>
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => setOptimizationType('basic')} className={`px-4 py-2 rounded-lg font-medium ${!isGrilling ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}>⚡ 查询事实</button>
            <button onClick={() => setOptimizationType('assumption-exam-and-grilling')} className={`px-4 py-2 rounded-lg font-medium ${isGrilling ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}>🤖 应对未知与复杂</button>
          </div>
          <p className="mb-6 text-sm text-orange-500">{isGrilling ? '适用于让AI协助应对未知或复杂问题' : '适用于让AI查询事实，添加标准提示词前缀和后缀'}</p>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) handleOptimize() }} placeholder="请输入您想要优化的提示词..." className="flex-1 w-full min-h-[120px] md:min-h-[150px] p-4 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 resize-y" />
            <button onClick={handleOptimize} disabled={!inputText.trim() || isOptimizing} className={`px-8 py-4 text-white font-semibold rounded-lg shadow-md min-w-[120px] ${isOptimizing || !inputText.trim() ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}>{isOptimizing ? '优化中...' : isGrilling ? '应对未知与复杂' : '查询事实'}</button>
          </div>
          <p className="mt-4 text-center text-sm text-orange-400">提示：按 Ctrl+Enter 快速优化</p>
        </section>
      </div>
    </main>
  )
}
