const prisma = require('../prismaClient.js');
const tableMaps = {


    mapAlumnos: (secondTable) => {
        return secondTable.map(a => ({
            alumno: a["Alumno"],
            dni: a["DNI"],
            correo: a["Email"],
            uo: a["Email"]?.split("@")[0] || null,
            telefono: null,
            fecha_ingreso: new Date(),
            contraseña: ""
        }));
    },


    mapGrupo: (secondTable) => {
        const grupos = secondTable
            .map(a => ({
                nombre: "",
                clases_expositivas: a["Clases Expositivas"],
                practicas_aula: a["Prácticas de Aula/Semina"],
                practicas_laboratorio: a["Prácticas de Laboratorio"],
                tutorias_grupales: a["Tutorías Grupales"]
            }))
            .filter(g =>
                g.clases_expositivas != null &&
                g.practicas_aula != null &&
                g.practicas_laboratorio != null &&
                g.tutorias_grupales != null
            );
        // Quitar duplicados usando una clave combinada
        const uniqueGrupos = Array.from(
            new Map(grupos.map(g => [
                `${g.clases_expositivas}|${g.practicas_aula}|${g.practicas_laboratorio}|${g.tutorias_grupales}`, // clave valor
                g
            ])).values()
        )
        return uniqueGrupos
    },



    mapMatricula: (firstTable, secondTable, alumnosID, idAsignatura, gruposID) => {
        return secondTable.map(a => {
            // Buscar el ID del alumno
            const alumno = alumnosID.find(x => x.dni === a["DNI"]);
            if (!alumno) return null; // seguridad
            // Buscar el ID del grupo correspondiente
            const grupo = gruposID.find(g =>
                g.clases_expositivas === a["Clases Expositivas"] &&
                g.practicas_aula === a["Prácticas de Aula/Semina"] &&
                g.practicas_laboratorio === a["Prácticas de Laboratorio"] &&
                g.tutorias_grupales === a["Tutorías Grupales"]
            );

            return {
                id_alumno: alumno.id,
                id_asignatura: idAsignatura,
                curso_academico: firstTable.find(f => f.clave === "Curso Académico:").valor,
                convocatorias: a["Convocatorias"],
                nota_actual: 0,
                evaluacion_diferenciada: a["Evaluación Diferenciada"],
                movilidad_erasmus: a["Movilidad Erasmus"],
                id_grupo: grupo ? grupo.id : null, // null si no se encuentra grupo (Erasmus)
                matriculas: a["Matrículas"]
            };
        }).filter(m => m !== null); // descartar errores
    }







}
module.exports = tableMaps
