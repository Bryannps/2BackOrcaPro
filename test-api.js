/**
 * Script para testar a API diretamente - DEBUG
 * Execute com: npm run test:api
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  try {
    console.log('🧪 Testando API diretamente...');
    
    // Primeiro, fazer login para obter token
    console.log('\n1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com', // Substitua por um email válido
      password: 'password123'     // Substitua por uma senha válida
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // Configurar headers com token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Testar endpoint /auth/me
    console.log('\n2️⃣ Testando /auth/me...');
    const meResponse = await axios.get(`${API_BASE}/auth/me`, { headers });
    console.log('✅ Usuário autenticado:', meResponse.data.data.user.name);
    
    // Testar endpoint /templates
    console.log('\n3️⃣ Testando /templates...');
    const templatesResponse = await axios.get(`${API_BASE}/templates`, { headers });
    console.log('✅ Templates encontrados:', templatesResponse.data.data.length);
    
    if (templatesResponse.data.data.length > 0) {
      const template = templatesResponse.data.data[0];
      console.log('📄 Primeiro template:', template.name);
      console.log('🏷️  Categorias:', template.categories.length);
      
      if (template.categories.length > 0) {
        const category = template.categories[0];
        console.log('📂 Primeira categoria:', category.name);
        console.log('🔧 Campos:', category.fields.length);
        
        // Testar endpoint /budgets/calculate
        console.log('\n4️⃣ Testando /budgets/calculate...');
        const calculatePayload = {
          template_id: template.id,
          items: [{
            category_id: category.id,
            field_values: {},
            order: 0
          }]
        };
        
        console.log('📤 Payload enviado:', JSON.stringify(calculatePayload, null, 2));
        
        const calculateResponse = await axios.post(
          `${API_BASE}/budgets/calculate`, 
          calculatePayload,
          { headers }
        );
        
        console.log('✅ Cálculo realizado:', calculateResponse.data);
      }
    }
    
  } catch (error) {
    console.log('\n❌ Erro no teste:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.message);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testAPI();