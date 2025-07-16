import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
  name: String,
  type: String,
  fields: [String],
  html: String,
  userId: String,
}, { versionKey: false, timestamps: true });

// const Template = mongoose.model('Template', TemplateSchema);

async function main() {
  await mongoose.connect('mongodb+srv://orienta:orientandoal100@orientacluster.98d1x.mongodb.net/speakhelp?retryWrites=true&w=majority&appName=OrientaCluster'); // Cambia el string de conexión si es necesario

  const userId = 'admin'; // Puedes cambiar esto por el userId que desees

  // Plantilla de Consulta
  await Template.create({
    name: 'Consulta General',
    type: 'Consulta',
    fields: [
      'motivo', 'sintomas', 'historiaPersonal', 'historiaFamiliar',
      'exploracionFisica', 'diagnostico', 'tratamiento', 'examenes', 'derivaciones', 'receta'
    ],
    html: `<h2>Informe Consulta Médica</h2>
<b>Motivo de Consulta:</b> {{motivo}}<br>
<b>Síntomas:</b> {{sintomas}}<br>
<b>Historia Personal:</b> {{historiaPersonal}}<br>
<b>Historia Familiar:</b> {{historiaFamiliar}}<br>
<b>Exploración Física:</b> {{exploracionFisica}}<br>
<b>Diagnóstico:</b> {{diagnostico}}<br>
<b>Tratamiento Prescrito:</b> {{tratamiento}}<br>
<b>Exámenes Solicitados:</b> {{examenes}}<br>
<b>Derivaciones:</b> {{derivaciones}}<br>
<b>Receta Médica:</b> {{receta}}<br>`,
    userId,
  });

  // Plantilla de Cirugía
  await Template.create({
    name: 'Cirugía General',
    type: 'Cirugía',
    fields: [
      'tipoCirugia', 'motivo', 'diagnosticoPre', 'diagnosticoPost',
      'procedimiento', 'hallazgos', 'complicaciones', 'tratamientoPost', 'recomendaciones'
    ],
    html: `<h2>Informe de Cirugía</h2>
<b>Tipo de Cirugía:</b> {{tipoCirugia}}<br>
<b>Motivo de la Cirugía:</b> {{motivo}}<br>
<b>Diagnóstico Preoperatorio:</b> {{diagnosticoPre}}<br>
<b>Diagnóstico Postoperatorio:</b> {{diagnosticoPost}}<br>
<b>Procedimiento Realizado:</b> {{procedimiento}}<br>
<b>Hallazgos:</b> {{hallazgos}}<br>
<b>Complicaciones:</b> {{complicaciones}}<br>
<b>Tratamiento Postoperatorio:</b> {{tratamientoPost}}<br>
<b>Recomendaciones:</b> {{recomendaciones}}<br>`,
    userId,
  });

  console.log('Plantillas insertadas correctamente');
  process.exit();
}

main(); 