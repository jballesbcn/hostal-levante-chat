
const fs = require('fs');
const path = require('path');

try {
  const apiKey = process.env.API_KEY || '';
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

  // Procesar solo archivos necesarios
  const files = ['main.js', 'chat.js', 'contact.js'];

  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const replacedContent = content.replace(/process\.env\.API_KEY/g, `'${apiKey}'`);
      fs.writeFileSync(path.join(distDir, file), replacedContent);
      console.log(`✅ ${file} procesado.`);
    }
  });
  
  const staticFiles = ['index.html', 'metadata.json', 'vercel.json', '.htaccess', 'send_email.php'];
  staticFiles.forEach(file => {
    const src = path.join(__dirname, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(distDir, file));
      console.log(`📄 ${file} copiado.`);
    }
  });

  console.log('🚀 Build finalizado.');
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
