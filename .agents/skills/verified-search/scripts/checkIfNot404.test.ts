import test from 'node:test';
import assert from 'node:assert';
import { checkTextForSoft404, checkUrl } from './checkIfNot404.ts';

test('checkTextForSoft404 should detect soft 404 indicators', (t) => {
  const cases = [
    { text: "<html><title>404 Not Found</title></html>", expected: true },
    { text: "<body>We couldn't find what you are looking for</body>", expected: true },
    { text: "Error 404", expected: true },
    { text: "Page you are looking for doesn't exist", expected: true },
    { text: "<html><body>Welcome to our store!</body></html>", expected: false },
    { text: "Just a regular page with 404 apples", expected: false }
  ];

  for (const c of cases) {
    const result = checkTextForSoft404(c.text);
    assert.strictEqual(result.isSoft404, c.expected, `Failed for text: ${c.text}`);
  }
});

test('checkUrl handles hard errors (e.g. 500)', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  global.fetch = async () => {
    return {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as Response;
  };

  const code = await checkUrl('http://fakeurl.com/500');
  assert.strictEqual(code, 1);
});

test('checkUrl handles soft 404s (e.g. 200 with 404 text)', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  global.fetch = async () => {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => "<html><body>we couldn't find what you are looking for</body></html>"
    } as Response;
  };

  const code = await checkUrl('http://fakeurl.com/soft404');
  assert.strictEqual(code, 2);
});

test('checkUrl handles valid pages', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  global.fetch = async () => {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '<html><body>Welcome to the real page</body></html>'
    } as Response;
  };

  const code = await checkUrl('http://fakeurl.com/valid');
  assert.strictEqual(code, 0);
});

test('checkUrl handles fetch exceptions', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  global.fetch = async () => {
    throw new Error("Network failure");
  };

  const code = await checkUrl('http://fakeurl.com/error');
  assert.strictEqual(code, 1);
});
