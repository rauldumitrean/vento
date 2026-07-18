const fs = require('fs');
const path = require('path');

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) { 
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('localStorage')) {
        let newContent = 'import Cookies from \'js-cookie\';\n' + content;
        
        // Replace setItem with expires: 365
        newContent = newContent.replace(/localStorage\.setItem\(([^,]+),\s*([^)]+)\)/g, 'Cookies.set($1, $2, { expires: 365 })');
        
        // Replace getItem
        newContent = newContent.replace(/localStorage\.getItem\(/g, 'Cookies.get(');
        
        // Replace removeItem
        newContent = newContent.replace(/localStorage\.removeItem\(/g, 'Cookies.remove(');
        
        if (newContent !== content) {
          fs.writeFileSync(fullPath, newContent);
          console.log('Updated ' + fullPath);
        }
      }
    }
  });
}
walk('src');
