// Test script para verificar el endpoint de validación de medicamentos
const axios = require('axios');

const BASE_URL = 'http://localhost:3001'; // Ajusta según tu configuración

async function testMedicationValidation() {
    try {
        console.log('🧪 Probando endpoint de validación de medicamentos...');
        
        const testData = {
            text: 'El paciente presenta dolor de cabeza y le receté paracetamol 500mg cada 8 horas, también ibuprofeno para la inflamación',
            country: 'CHL'
        };

        console.log('📤 Enviando datos:', testData);

        const response = await axios.post(`${BASE_URL}/api/medication-validation`, testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Respuesta exitosa:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

        // Verificar estructura de respuesta
        if (response.data.found !== undefined && 
            response.data.notFound !== undefined && 
            response.data.suggestions !== undefined && 
            response.data.summary !== undefined) {
            console.log('✅ Estructura de respuesta correcta');
        } else {
            console.log('❌ Estructura de respuesta incorrecta');
        }

    } catch (error) {
        console.error('❌ Error en la prueba:');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('Error de red:', error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Ejecutar la prueba
testMedicationValidation();
