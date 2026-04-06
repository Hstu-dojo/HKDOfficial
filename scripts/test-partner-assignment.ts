import assert from 'node:assert/strict'
import { getPartnerIdFromRegistrationRow, parseNotesRecord } from '../src/lib/partner-assignment'

function run() {
  // parseNotesRecord
  assert.deepEqual(parseNotesRecord(null), {})
  assert.deepEqual(parseNotesRecord(undefined), {})
  assert.deepEqual(parseNotesRecord(''), {})
  assert.deepEqual(parseNotesRecord('not-json'), {})
  assert.deepEqual(parseNotesRecord('{"a":1}'), { a: 1 })
  assert.deepEqual(parseNotesRecord({ a: 1 }), { a: 1 })

  // getPartnerIdFromRegistrationRow prefers column
  assert.equal(
    getPartnerIdFromRegistrationRow({ partnerId: 'p_col', notes: '{"partnerId":"p_notes"}' }),
    'p_col'
  )

  // falls back to notes.partnerId
  assert.equal(getPartnerIdFromRegistrationRow({ partnerId: null, notes: '{"partnerId":"p_notes"}' }), 'p_notes')

  // empty / invalid cases
  assert.equal(getPartnerIdFromRegistrationRow({ partnerId: null, notes: '{}' }), null)
  assert.equal(getPartnerIdFromRegistrationRow({ partnerId: null, notes: 'not-json' }), null)

  console.log('✅ partner-assignment unit tests passed')
}

run()
