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

    mapGrupo: (secondTable, idAsignatura) => {
        const grupos = secondTable
            .map(a => {
                const ce = a["Clases Expositivas"] || "";
                const pa = a["Prácticas de Aula/Semina"] || "";
                const pl = a["Prácticas de Laboratorio"] || "";
                const tg = a["Tutorías Grupales"] || "";

                if (!ce && !pa && !pl && !tg) return null;

                const key = `${ce}|${pa}|${pl}|${tg}`;
                return { key, nombre: key, id_asignatura: idAsignatura, clasesArr: [ce, pa, pl, tg] };
            })
            .filter(Boolean);

        // quitar duplicados por key
        const unique = Array.from(new Map(grupos.map(g => [g.key, g])).values());
        return unique; // [{ key, nombre, clasesArr }, ...]
    },

    mapClases: (secondTable, idAsignatura) => {
        const columnas = [
            "Clases Expositivas",
            "Prácticas de Aula/Semina",
            "Prácticas de Laboratorio",
            "Tutorías Grupales"
        ];

        let clases = [];

        secondTable.forEach(fila => {
            columnas.forEach(col => {
                const nombre = fila[col];
                if (nombre) {
                    clases.push({
                        tipo: col,
                        nombre: nombre,
                        id_asignatura: idAsignatura
                    });
                }
            });
        });

        // Quitar duplicados
        const uniqueClases = Array.from(
            new Map(clases.map(c => [`${c.tipo}|${c.nombre}|${c.id_asignatura}`, c])).values()
        );

        return uniqueClases;
    },

    mapMatricula: (firstTable, secondTable, alumnosID, idAsignatura, gruposID) => {
        return secondTable.map(a => {
            // Buscar el ID del alumno
            const alumno = alumnosID.find(x => x.dni === a["DNI"]);
            if (!alumno) return null;

            // Generar la "key" igual que en mapGrupo
            const key = `${a["Clases Expositivas"] || ""}|${a["Prácticas de Aula/Semina"] || ""}|${a["Prácticas de Laboratorio"] || ""}|${a["Tutorías Grupales"] || ""}`;

            // Buscar el grupo por esa key (nombre en la BD)
            const grupo = gruposID.find(g => g.nombre === key);

            return {
                id_alumno: alumno.id,
                id_asignatura: idAsignatura,
                curso_academico: firstTable.find(f => f.clave === "Curso Académico:")?.valor || "",
                convocatorias: a["Convocatorias"],
                nota_actual: 0,
                evaluacion_diferenciada: a["Evaluación Diferenciada"],
                movilidad_erasmus: a["Movilidad Erasmus"],
                id_grupo: grupo ? grupo.id : null, // Erasmus o sin grupo
                matriculas: a["Matrículas"]
            };
        }).filter(m => m !== null);
    },

    mapNotas: (alumnos, tabla, idPrueba) => {
        // Crear mapa UO → ID de los alumnos encontrados
        const mapUoToId = new Map(alumnos.map(a => [a.uo, a.id]));

        const listaNotas = [];
        const uosNoEncontrados = [];

        for (const row of tabla) {
            const idAlumno = mapUoToId.get(row.uo);
            if (idAlumno) {
                listaNotas.push({
                    nota: row.nota,
                    id_alumno: idAlumno,
                    id_prueba: idPrueba
                });
            } else {
                uosNoEncontrados.push(row.uo);
            }
        }

        return { listaNotas, uosNoEncontrados };
    }




}
module.exports = tableMaps
