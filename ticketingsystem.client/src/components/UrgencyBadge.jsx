export default function UrgencyBadge({ urgency }) {
  const urgent = urgency === 'Urgent'
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: urgent ? '#fee2e2' : '#f3f4f6',
      color:      urgent ? '#991b1b' : '#374151',
      textTransform: 'uppercase', letterSpacing: '0.5px'
    }}>
      {urgent ? '🔴 Urgent' : 'Not Urgent'}
    </span>
  )
}
