import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

/**
 * Panel reutilizable para importación masiva por Excel.
 * Muestra botón de descarga de plantilla y subida de archivo.
 * 
 * Props:
 *  - templateColumns: Array de { header, example, key }
 *  - templateFileName: Nombre del archivo de plantilla
 *  - onImport: Callback con los datos parseados (array de objects)
 *  - title: Título del panel (opcional)
 */
const ExcelImportPanel = ({ templateColumns, templateFileName, onImport, title = "Importación Masiva" }) => {
    const fileInputRef = useRef(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null); // { success: bool, message: string }

    // Generar y descargar plantilla Excel
    const handleDescargarPlantilla = () => {
        const headers = templateColumns.map(c => c.header);
        
        // Crear filas: Encabezados -> 2 filas vacías para datos -> Instrucciones
        const rowData = [
            headers,
            [],
            [],
            ['--- INSTRUCCIONES DE LLENADO (empieza a llenar tus datos desde la fila 2 hacia abajo, no aquí) ---'],
            ...templateColumns.map(c => [`• Columna "${c.header}": Por ejemplo, colocar "${c.example}"`])
        ];

        const ws = XLSX.utils.aoa_to_sheet(rowData);

        // Ancho de columnas (la primera más ancha para las instrucciones)
        ws['!cols'] = templateColumns.map((c, i) => {
            if (i === 0) return { wch: 85 }; 
            return { wch: Math.max(c.header.length, String(c.example).length) + 10 };
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Datos");
        XLSX.writeFile(wb, templateFileName);
    };

    // Leer archivo Excel subido
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            if (!jsonData || jsonData.length === 0) {
                setImportResult({ success: false, message: "El archivo está vacío o no tiene datos válidos." });
                return;
            }

            // Mapear headers del Excel a las keys esperadas
            const mappedData = jsonData.map(row => {
                const mapped = {};
                templateColumns.forEach(col => {
                    // Buscar por header exacto
                    mapped[col.key] = row[col.header] ?? '';
                });
                return mapped;
            });

            // Filtrar filas completamente vacías y filas de instrucciones
            const validData = mappedData.filter(row => {
                const firstKey = templateColumns[0].key;
                const firstVal = String(row[firstKey] || '').trim();
                
                // Ignorar filas de instrucciones generadas por la plantilla
                if (firstVal.startsWith('---') || firstVal.startsWith('• Columna')) {
                    return false;
                }

                // Asegurar que tenga algún dato real
                return Object.values(row).some(v => v !== '' && v !== null && v !== undefined);
            });

            if (validData.length === 0) {
                setImportResult({ success: false, message: "No se encontraron datos válidos. Verifica que las columnas del Excel coincidan con la plantilla." });
                return;
            }

            // Llamar al callback del padre con los datos
            const result = await onImport(validData);
            setImportResult(result);
        } catch (err) {
            setImportResult({ success: false, message: `Error al leer el archivo: ${err.message}` });
        } finally {
            setImporting(false);
            // Resetear input para permitir subir el mismo archivo otra vez
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white border border-slate-100 shadow-sm rounded-[24px] p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3 mb-2">
                <div className="text-[var(--color-brand-primary)] bg-[var(--color-brand-light)] p-2.5 rounded-xl flex-shrink-0 mt-0.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-[15px] font-extrabold text-slate-800">{title}</h3>
                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-1 pr-1">
                        Descarga la plantilla y sube tu archivo para registrar todo de forma masiva y automática.
                    </p>
                </div>
            </div>

            {/* Botón Descargar Plantilla */}
            <button
                onClick={handleDescargarPlantilla}
                className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[12px] py-3 px-4 rounded-xl border border-emerald-200 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar Plantilla Excel
            </button>

            {/* Botón Subir Archivo */}
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-brand-light)] hover:bg-indigo-100 text-[var(--color-brand-primary)] font-bold text-[12px] py-3 px-4 rounded-xl border border-indigo-200/50 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {importing ? (
                    <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Importando...
                    </>
                ) : (
                    <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Importar desde Excel
                    </>
                )}
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* El resultado ahora se muestra externamente mediante toasts o alertas */}
        </div>
    );
};

export default ExcelImportPanel;
