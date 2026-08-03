const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\raul\\.gemini\\antigravity\\brain\\f99ab2c9-04cc-45b3-8e67-b2edc92537c2\\.system_generated\\steps\\12683\\content.md', 'utf8');
const urls = content.match(/https?:\/\/[^\/\"'`]+/g);
if (urls) {
  console.log([...new Set(urls)].join('\n'));
} else {
  console.log('No URLs found');
}
