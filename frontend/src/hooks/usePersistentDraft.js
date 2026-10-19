import { useEffect, useState } from 'react'

const identity = (value) => value

function readDraft(key, initialValue, sanitize) {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return { value: initialValue, restored: false }
    return { value: sanitize({ ...initialValue, ...JSON.parse(stored) }), restored: true }
  } catch {
    return { value: initialValue, restored: false }
  }
}

export default function usePersistentDraft(key, initialValue, sanitize = identity) {
  const [initial] = useState(() => readDraft(key, initialValue, sanitize))
  const [state, setState] = useState(() => ({ value: initial.value, dirty: false }))

  useEffect(() => {
    if (!state.dirty) return
    try {
      localStorage.setItem(key, JSON.stringify(sanitize(state.value)))
    } catch {
      // Draft persistence is best-effort when browser storage is unavailable.
    }
  }, [key, sanitize, state])

  function updateValue(updater) {
    setState((current) => ({
      value: typeof updater === 'function' ? updater(current.value) : updater,
      dirty: true,
    }))
  }

  function replaceValue(value) {
    setState({ value, dirty: false })
  }

  function clearDraft(value = initialValue) {
    try {
      localStorage.removeItem(key)
    } catch {
      // The form still resets if browser storage is unavailable.
    }
    setState({ value, dirty: false })
  }

  return [state.value, updateValue, clearDraft, initial.restored, replaceValue]
}
