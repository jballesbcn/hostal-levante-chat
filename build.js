
const fs = require('fs');
const path = require('path');

try {
  const apiKey = process.env.API_KEY || '';
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

  const files = ['main.js', 'chat.js', 'booking.js', 'contact.js'];

  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const replacedContent = content.replace(/process\.env\.API_KEY/g, `'${apiKey}'`);
      fs.writeFileSync(path.join(distDir, file), replacedContent);
      console.log(`✅ ${file} procesado.`);
    }
  });
  
  const staticFiles = ['index.html', 'metadata.json', 'vercel.json', '.htaccess'];
  staticFiles.forEach(file => {
    const src = path.join(__dirname, file);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distDir, file));
  });

  console.log('🚀 Build Finalizado.');
} catch (error) {
  console.error('❌ Error en el build:', error);
  process.exit(1);
}
