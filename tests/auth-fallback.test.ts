import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isAuthoritativeAuthRejection} from '../src/shared/authFallback';

// Regression guard for the admin login loop: when the server definitively rejects credentials,
// the client must not fall back to a locally synthesized session (which has no auth token and is
// therefore cleared by the next /api/auth/session check, bouncing the user back to the login form).
test('authoritative rejection blocks the offline credential fallback',()=>{
  assert.equal(isAuthoritativeAuthRejection(401,{success:false,authenticated:false,message:'Invalid password.'}),true);
  assert.equal(isAuthoritativeAuthRejection(403,{success:false,authenticated:false}),true);
  // A 2xx that explicitly says "no" is still an authoritative answer.
  assert.equal(isAuthoritativeAuthRejection(200,{success:false,authenticated:false}),true);
});

test('unreachable or unhealthy server keeps the offline fallback',()=>{
  // No parseable JSON body: network failure, HTML error page, proxy interception.
  assert.equal(isAuthoritativeAuthRejection(200,null),false);
  assert.equal(isAuthoritativeAuthRejection(0,undefined),false);
  assert.equal(isAuthoritativeAuthRejection(502,'<html>Bad Gateway</html>'),false);
  // 5xx means the server could not decide, so a local fallback is still allowed.
  assert.equal(isAuthoritativeAuthRejection(500,{success:false,authenticated:false,message:'boom'}),false);
});

test('non-rejection bodies are not treated as rejections',()=>{
  assert.equal(isAuthoritativeAuthRejection(200,{success:true,authenticated:true,token:'x'}),false);
  // 4xx without an explicit success/authenticated flag must not be guessed at.
  assert.equal(isAuthoritativeAuthRejection(404,{message:'not found'}),false);
});
