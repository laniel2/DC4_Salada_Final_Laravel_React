export default function Message({ error, children }) {
  if (!children) return null
  return <div className={error ? 'message error' : 'message'} role="status">{children}</div>
}
