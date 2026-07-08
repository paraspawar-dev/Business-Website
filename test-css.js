const fs = require('fs');
const css = fs.readFileSync('css/styles.css', 'utf8');
const lines = css.split('\n');
console.log("CSS Lines:", lines.length);
// Check for basic unclosed brackets
let openBraces = 0;
for(let i=0; i<css.length; i++) {
  if(css[i] === '{') openBraces++;
  if(css[i] === '}') openBraces--;
}
console.log("Open Braces Balance:", openBraces);
