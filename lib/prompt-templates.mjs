const ASSUMPTION_EXAM_AND_GRILLING_PROTOCOL = `请在当前目录下，按下面要求完成任务：
1）在开始设计树之前，先执行 Round 0（假设体检）：
1.1) 列出我下面要求里没有明说、但你已默认成立的假设（逐条编号，形如：A1、A2、A3……）；
1.2) 列出你还缺哪些关键信息，并说明每条信息会如何改变你的方案（逐条编号，形如：M1、M2、M3……）；
1.3) 指出人们处理这类问题时最常犯的一个错误；
1.4) 只提一个最关键的问题 —— 这个问题要能帮你搞清我的真实目标和具体处境，而不是最后给我一份谁都能套用的通用建议。这个问题的格式如下：
[\`\`\`
❓ **Q0** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
\`\`\`]
2）Round 0 只问上述这一个问题，不要提前问别的。我回答后，你再按 grilling 的常规轮次（frontier / 编号问题 / 推荐答案）推进设计树，直到前沿清空。
3）按下面grilling的要求盘问我的诉求：
---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Each question should be formatted like so:

[\`\`\`
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
\`\`\`]

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.
4）我的诉求如下：`

export function buildAssumptionExamAndGrillingPrompt(request) {
  return `${ASSUMPTION_EXAM_AND_GRILLING_PROTOCOL}\n${request}`
}
