;(() => {
  // Sentences array
  const SENTENCES = [
    "Practice makes progress, not perfection.",
    "The quick brown fox jumps over the lazy dog.",
    "Typing faster starts with accuracy and consistency.",
    "Great things are done by a series of small things brought together.",
    "Simplicity is the ultimate sophistication.",
    "Discipline is the bridge between goals and accomplishment.",
    "Stay curious and keep learning every day.",
    "Small daily improvements lead to stunning results over time.",
    "Focus on the process, and the results will follow.",
    "Clarity comes from action, not thought alone.",
  ]

  // Average WPM threshold for fun message
  const AVERAGE_WPM = 40

  // DOM Elements
  const targetEl = document.getElementById("target")
  const inputEl = document.getElementById("input")
  const timeEl = document.getElementById("time")
  const restartBtn = document.getElementById("restart")
  const resultEl = document.getElementById("result")
  const wpmEl = document.getElementById("wpm")
  const accuracyEl = document.getElementById("accuracy")
  const messageEl = document.getElementById("message")
  const leaderboardEl = document.getElementById("leaderboard")

  // State
  let currentSentence = ""
  let started = false
  let finished = false
  let startTime = 0
  let timerId = null

  // Initialize
  function init() {
    currentSentence = pickRandomSentence()
    renderSentence(currentSentence)
    inputEl.value = ""
    started = false
    finished = false
    startTime = 0
    updateTime(0)
    stopTimer()
    hideResult()
    inputEl.removeAttribute("disabled")
    inputEl.focus()
    inputEl.setSelectionRange(0, 0)
    renderLeaderboard()
  }

  function pickRandomSentence() {
    const idx = Math.floor(Math.random() * SENTENCES.length)
    return SENTENCES[idx]
  }

  // Render target sentence as spans for per-character highlighting
  function renderSentence(sentence) {
    targetEl.innerHTML = ""
    for (let i = 0; i < sentence.length; i++) {
      const span = document.createElement("span")
      span.textContent = sentence[i]
      span.className = "char"
      targetEl.appendChild(span)
    }
    // mark current first char
    if (sentence.length > 0) {
      targetEl.children[0].classList.add("current")
    }
  }

  function updateHighlights(typed) {
    const chars = targetEl.children
    const len = Math.max(typed.length, currentSentence.length)

    for (let i = 0; i < len; i++) {
      const expected = currentSentence[i] || ""
      const actual = typed[i] || ""
      const span = chars[i]

      if (!span) continue

      span.classList.remove("correct", "incorrect", "current")

      if (actual.length === 0) {
        // Not typed yet
      } else if (actual === expected) {
        span.classList.add("correct")
      } else {
        span.classList.add("incorrect")
      }
    }

    // Mark current caret position
    const caretIndex = Math.min(typed.length, currentSentence.length - 1)
    if (chars[caretIndex]) {
      chars[caretIndex].classList.add("current")
    }
  }

  function startTimer() {
    startTime = performance.now()
    if (timerId) return
    timerId = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000
      updateTime(elapsed)
    }, 50)
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  function updateTime(seconds) {
    timeEl.textContent = `${seconds.toFixed(1)}s`
  }

  function computeResults(typed, elapsedSeconds) {
    // Words per minute = words typed / time in minutes
    const wordsTyped = typed.trim() ? typed.trim().split(/\s+/).length : 0
    const minutes = Math.max(elapsedSeconds / 60, 1 / 60_000) // avoid divide by zero
    const wpm = wordsTyped / minutes

    // Accuracy = correct chars / total chars of target
    let correctChars = 0
    const totalChars = currentSentence.length

    for (let i = 0; i < totalChars; i++) {
      if (typed[i] === currentSentence[i]) {
        correctChars++
      }
    }

    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0

    return {
      wpm: Math.round(wpm * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
      time: Math.round(elapsedSeconds * 10) / 10,
    }
  }

  function showResult({ wpm, accuracy, time }) {
    wpmEl.textContent = `${wpm}`
    accuracyEl.textContent = `${accuracy}%`

    if (wpm > AVERAGE_WPM) {
      messageEl.textContent = "You’re faster than 70% of users!"
    } else {
      messageEl.textContent = "Keep practicing!"
    }

    resultEl.classList.remove("hidden")
  }

  function hideResult() {
    resultEl.classList.add("hidden")
  }

  function saveResultToStorage(result) {
    try {
      const key = "typingTestResults"
      const existing = JSON.parse(localStorage.getItem(key) || "[]")
      const now = new Date()
      const entry = {
        ...result,
        date: now.toISOString(),
      }
      const updated = [entry, ...existing].slice(0, 5)
      localStorage.setItem(key, JSON.stringify(updated))
    } catch {
      // ignore storage errors
    }
  }

  function renderLeaderboard() {
    const key = "typingTestResults"
    let data = []
    try {
      data = JSON.parse(localStorage.getItem(key) || "[]")
    } catch {
      data = []
    }
    leaderboardEl.innerHTML = ""

    if (!data.length) {
      const li = document.createElement("li")
      li.className = "leaderboard-item"
      li.textContent = "No results yet. Complete a test to see stats here."
      leaderboardEl.appendChild(li)
      return
    }

    data.forEach((entry) => {
      const li = document.createElement("li")
      li.className = "leaderboard-item"

      const left = document.createElement("div")
      left.textContent = `WPM: ${entry.wpm} • Accuracy: ${entry.accuracy}%`

      const right = document.createElement("div")
      right.className = "leaderboard-meta"
      const d = new Date(entry.date)
      right.textContent = d.toLocaleString()

      li.appendChild(left)
      li.appendChild(right)
      leaderboardEl.appendChild(li)
    })
  }

  // Event handlers
  inputEl.addEventListener("input", () => {
    if (finished) return

    const typed = inputEl.value

    // Start timer on first input
    if (!started && typed.length > 0) {
      started = true
      startTimer()
    }

    updateHighlights(typed)

    // Finish when fully matches target
    if (typed === currentSentence) {
      finished = true
      stopTimer()
      const elapsedSeconds = (performance.now() - startTime) / 1000
      const result = computeResults(typed, elapsedSeconds)
      showResult(result)
      saveResultToStorage(result)
      renderLeaderboard()
      inputEl.setAttribute("disabled", "true")
    }
  })

  restartBtn.addEventListener("click", () => {
    init()
  })

  // Initialize on load
  window.addEventListener("DOMContentLoaded", init)
})()
