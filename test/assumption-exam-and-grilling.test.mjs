import assert from 'node:assert/strict'
import test from 'node:test'

import { buildAssumptionExamAndGrillingPrompt } from '../lib/prompt-templates.mjs'

test('appends the user request after the fixed grilling protocol without changing it', () => {
  const request = '如何评测一个tool-using-agent的正确性、稳定性和安全性？'

  const result = buildAssumptionExamAndGrillingPrompt(request)

  assert.ok(result.startsWith('请在当前目录下，按下面要求完成任务：'))
  assert.ok(result.includes('❓ **Q0** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>'))
  assert.ok(result.includes('Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled'))
  assert.equal(result.endsWith(`4）我的诉求如下：\n${request}`), true)
})
