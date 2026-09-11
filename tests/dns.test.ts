import assert from 'node:assert/strict';
import test from 'node:test';
import { extractRecords, type GoogleDnsResponse } from '../src/lib/dns.ts';

test('extractRecords maps known and unknown DNS record types', () => {
  const response: GoogleDnsResponse = {
    Status: 0,
    TC: false,
    RD: true,
    RA: true,
    AD: false,
    CD: false,
    Answer: [
      { name: 'example.com.', type: 1, TTL: 300, data: '192.0.2.1' },
      { name: 'example.com.', type: 65000, TTL: 60, data: 'opaque' },
    ],
  };

  assert.deepEqual(extractRecords(response), [
    { name: 'example.com.', type: 'A', ttl: 300, data: '192.0.2.1' },
    { name: 'example.com.', type: 'TYPE65000', ttl: 60, data: 'opaque' },
  ]);
});

test('extractRecords returns an empty list for NODATA responses', () => {
  const response: GoogleDnsResponse = {
    Status: 0,
    TC: false,
    RD: true,
    RA: true,
    AD: false,
    CD: false,
  };
  assert.deepEqual(extractRecords(response), []);
});
