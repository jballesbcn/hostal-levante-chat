
const fs = require('fs');
const path = require('path');

try {
  const apiKey = process.env.API_KEY || '';
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

  // Lista de archivos modulares a procesar
  const files = ['main.js', 'chat.js', 'contact.js'];

  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      // Inyectar API KEY real en el código
      const replacedContent = content.replace(/process\.env\.API_KEY/g, `'${apiKey}'`);
      fs.writeFileSync(path.join(distDir, file), replacedContent);
      console.log(`✅ ${file} procesado e inyectado.`);
    }
  });
  
  // Copiar archivos estáticos necesarios
  const staticFiles = ['index.html', 'metadata.json', 'vercel.json', '.htaccess'];
  staticFiles.forEach(file => {
    const src = path.join(__dirname, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(distDir, file));
      console.log(`📄 ${file} copiado a dist.`);
    }
  });

  console.log('🚀 Restauración modular completada con éxito.');
} catch (error) {
  console.error('❌ Error durante el build:', error);
  process.exit(1);
}
