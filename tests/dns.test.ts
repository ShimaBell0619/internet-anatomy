import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertDnsResponseStatus,
  exploreDns,
  extractRecords,
  type GoogleDnsResponse,
} from '../src/lib/dns.ts';

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

test('assertDnsResponseStatus surfaces DNS protocol errors instead of treating them as NODATA', () => {
  const response: GoogleDnsResponse = {
    Status: 2,
    TC: false,
    RD: true,
    RA: true,
    AD: false,
    CD: false,
  };

  assert.throws(
    () => assertDnsResponseStatus(response, 'example.com. A'),
    /SERVFAIL \(2\)/,
  );
});

test('assertDnsResponseStatus can defer NXDOMAIN handling for namespace discovery', () => {
  const response: GoogleDnsResponse = {
    Status: 3,
    TC: false,
    RD: true,
    RA: true,
    AD: false,
    CD: false,
  };

  assert.doesNotThrow(() => assertDnsResponseStatus(response, 'missing.example. NS', true));
  assert.throws(
    () => assertDnsResponseStatus(response, 'missing.example. A'),
    /NXDOMAIN \(3\)/,
  );
});

test('exploreDns propagates an SOA protocol error instead of hiding it', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url =
      input instanceof URL
        ? input
        : typeof input === 'string'
          ? new URL(input)
          : new URL(input.url);
    const name = url.searchParams.get('name') ?? '';
    const type = url.searchParams.get('type') ?? '';

    const response: GoogleDnsResponse = {
      Status: type === 'SOA' && name === 'example.com.' ? 2 : 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer:
        type === 'NS'
          ? [{ name, type: 2, TTL: 300, data: `ns.${name === '.' ? 'root.' : name}` }]
          : [],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    await assert.rejects(exploreDns('example.com'), /example\.com\. SOA.*SERVFAIL \(2\)/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
