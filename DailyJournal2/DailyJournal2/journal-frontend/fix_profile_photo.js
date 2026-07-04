const fs = require('fs');
const path = require('path');
const frontendDir = path.join(__dirname, 'src');

function searchAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchAndReplace(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const replacement = `const getProfilePhotoUrl = (profilePicture) => {
    if (!profilePicture) return undefined;
    if (profilePicture.startsWith('http')) return profilePicture;
    const filename = profilePicture.split('/').pop();
    return \`\${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/api/users/profile-photo/\${filename}?t=\${Date.now()}\`;
  };`;
      
      let modified = false;
      
      if (content.includes('const getProfilePhotoUrl = (profilePicture) => {') && content.includes('if (!profilePicture) return undefined;')) {
        let startIndex = content.indexOf('const getProfilePhotoUrl = (profilePicture) => {');
        while(startIndex !== -1) {
          let endIndex = content.indexOf('};', startIndex);
          if (endIndex !== -1) {
            let funcBody = content.substring(startIndex, endIndex + 2);
            if (funcBody.includes('profile-photo')) {
               content = content.substring(0, startIndex) + replacement + content.substring(endIndex + 2);
               modified = true;
               startIndex = content.indexOf('const getProfilePhotoUrl = (profilePicture) => {', startIndex + replacement.length);
            } else {
               startIndex = content.indexOf('const getProfilePhotoUrl = (profilePicture) => {', endIndex);
            }
          } else {
            break;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log('Modified: ' + fullPath);
      }
    }
  }
}

searchAndReplace(frontendDir);
console.log('Done');
