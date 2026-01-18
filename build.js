
const fs = require('fs');
const path = require('path');

try {
  // Obtenemos la clave de las variables de entorno de Vercel
  const apiKey = process.env.API_KEY || '';
  
  // Leemos el archivo original
  const mainPath = path.join(__dirname, 'main.js');
  let content = fs.readFileSync(mainPath, 'utf8');

  // Reemplazamos la variable por la clave real (entre comillas)
  // Buscamos process.env.API_KEY y lo cambiamos por 'TU_CLAVE_AQUI'
  const replacedContent = content.replace(/process\.env\.API_KEY/g, `'${apiKey}'`);

  // Creamos la carpeta dist si no existe
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)){
      fs.mkdirSync(distDir);
  }

  // Guardamos el resultado en dist/main.js
  fs.writeFileSync(path.join(distDir, 'main.js'), replacedContent);
  
  console.log('✅ Build completado: API_KEY inyectada con éxito en dist/main.js');
} catch (error) {
  console.error('❌ Error durante el build:', error);
  process.exit(1);
}
