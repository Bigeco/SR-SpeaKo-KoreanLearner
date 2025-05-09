const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // GitHub 정보
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Netlify 환경변수에 등록 필요
  const OWNER = 'Bigeco'; // 깃허브 owner
  const REPO = 'SR-SpeaKo-KoreanLearner'; // 깃허브 repo

  // GitHub API endpoint
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/dispatches`;

  // POST body
  const body = JSON.stringify({
    event_type: 'netlify-build-complete'
  });

  // POST 요청
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body
  });

  if (response.ok) {
    return {
      statusCode: 200,
      body: 'GitHub Actions triggered!'
    };
  } else {
    const text = await response.text();
    return {
      statusCode: 500,
      body: `Failed to trigger GitHub Actions: ${text}`
    };
  }
}; 