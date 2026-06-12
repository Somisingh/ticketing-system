const MAP = {
  Open:        'badge-open',
  ToDo:        'badge-todo',
  InProgress:  'badge-inprogress',
  Blocked:     'badge-blocked',
  UnderReview: 'badge-underreview',
  Resolved:    'badge-resolved',
  Closed:      'badge-closed',
}

export default function StatusBadge({ status }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap'
    }} className={MAP[status] || 'badge-open'}>
      {status}
    </span>
  )
}
