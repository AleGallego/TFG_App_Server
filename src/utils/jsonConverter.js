const XLSX = require("xlsx");

const jsonConverter = {

    excelToJson: (data) => {
        const workbook = XLSX.readFile(data);
        // Obtener primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Leer todo como matriz (cada fila es un array)
        const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // PRIMERA TABLA (3 filas x 1 columna)
        const firstTable = allData
            .slice(3, 8) // coges las filas donde están los metadatos
            .filter(row => row[1] !== undefined && row[2] !== undefined) // quitamos vacías
            .map(row => ({
                clave: row[1],
                valor: row[2]
            }));
        // SEGUNDA TABLA (12 filas x n columna)
        const headers = allData[9].slice(0, 12); // fila 10 → cabeceras
        const rows = allData.slice(10); // fila 11 en adelante → datos

        const secondTable = [];
        for (const row of rows) {
            // si no hay DNI en la columna 1 → cortar
            if (!row[1]) break;

            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = row[i] ?? null; // si falta algún valor, lo pones a null
            });
            secondTable.push(obj);
        }

        return { Asignatura: firstTable, Alumnos: secondTable }
    }


}
module.exports = jsonConverter
