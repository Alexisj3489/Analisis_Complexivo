const XLSX = require('xlsx');

const data = [
  {
    '¿Cómo califica la atención?': 'Mala',
    '¿Qué servicios utilizó?': 'Postventa',
    '¿Con qué frecuencia visita nuestro negocio?': 'Frecuentemente',
    'Califique nuestra atención al cliente': 5,
    '¿Qué tan satisfecho está, del 1 al 5?': 1,
    '¿Recomendaría nuestro servicio?': 'No',
  },
  {
    '¿Cómo califica la atención?': 'Muy buena',
    '¿Qué servicios utilizó?': 'Soporte tecnico;Ventas',
    '¿Con qué frecuencia visita nuestro negocio?': 'Siempre',
    'Califique nuestra atención al cliente': 3,
    '¿Qué tan satisfecho está, del 1 al 5?': 4,
    '¿Recomendaría nuestro servicio?': 'Si',
  },
  {
    // Fila inválida a propósito: rating fuera de rango (10, debe ser 1-5)
    '¿Cómo califica la atención?': 'Buena',
    '¿Qué servicios utilizó?': 'Ventas',
    '¿Con qué frecuencia visita nuestro negocio?': 'A veces',
    'Califique nuestra atención al cliente': 10,
    '¿Qué tan satisfecho está, del 1 al 5?': 3,
    '¿Recomendaría nuestro servicio?': 'Si',
  },
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Respuestas');
XLSX.writeFile(workbook, 'test-import.xlsx');

console.log('Archivo test-import.xlsx generado con éxito');