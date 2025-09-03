// Простой тест сборки фреймворка
const fs = require('fs');
const path = require('path');

// Проверяем что файлы созданы
const buildFile = path.join(__dirname, 'dist', 'js-framework.iife.js');

if (fs.existsSync(buildFile)) {
  console.log('✅ Файл сборки найден:', buildFile);
  
  const content = fs.readFileSync(buildFile, 'utf8');
  const size = (content.length / 1024).toFixed(2);
  console.log(`📦 Размер сборки: ${size} KB`);
  
  // Проверяем что основные экспорты присутствуют
  const exports = [
    'JSFramework', 
    'HTMLRenderer', 
    'ConfigValidator',
    'createReactive',
    'computed'
  ];
  
  const missingExports = exports.filter(exp => !content.includes(exp));
  
  if (missingExports.length === 0) {
    console.log('✅ Все основные экспорты присутствуют');
  } else {
    console.log('❌ Отсутствующие экспорты:', missingExports);
  }
  
  console.log('✅ Сборка успешна!');
} else {
  console.log('❌ Файл сборки не найден!');
}