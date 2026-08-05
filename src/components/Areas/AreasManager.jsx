import React, { useState, useEffect } from 'react';
import ModuleSidebar from '../Shared/ModuleSidebar';
import ExcelImportPanel from '../Shared/ExcelImportPanel';
import * as XLSX from 'xlsx';

const API_BASE = 'http://localhost:8000/api';

// --- Colores Dinámicos para las Carpetas ---
const FOLDER_COLORS = [
    { bg: '#8b5cf6', shadow: 'rgba(139,92,246,0.5)' }, // Violet
    { bg: '#3b82f6', shadow: 'rgba(59,130,246,0.5)' }, // Blue
    { bg: '#10b981', shadow: 'rgba(16,185,129,0.5)' }, // Emerald
    { bg: '#f43f5e', shadow: 'rgba(244,63,94,0.5)' }, // Rose
    { bg: '#f59e0b', shadow: 'rgba(245,158,11,0.5)' }, // Amber
    { bg: '#06b6d4', shadow: 'rgba(6,182,212,0.5)' }, // Cyan
    { bg: '#ec4899', shadow: 'rgba(236,72,153,0.5)' }, // Pink
    { bg: '#14b8a6', shadow: 'rgba(20,184,166,0.5)' }, // Teal
];

// --- Componente Tarjeta Carpeta (Ticket Style) ---
const AreaFolderCard = ({ area, onEdit, onDelete, index, isSelected, onToggleSelect, isSelectionMode }) => {
    // Determinar color en base al índice o ID
    const colorIdx = (index !== undefined ? index : (area.id_area || 0)) % FOLDER_COLORS.length;
    const color = FOLDER_COLORS[colorIdx];

    return (
        <div
            className={`relative w-full rounded-[20px] cursor-pointer shadow-sm border overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-300 group ${isSelected ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-light)]/20 ring-4 ring-[var(--color-brand-primary)]/30' : 'border-slate-100 bg-white'}`}
            onClick={() => isSelectionMode ? onToggleSelect(area.id_area) : onEdit(area)}
        >

            {/* Top part (Solid color, decorative) */}
            <div
                className="h-8 w-full"
                style={{ backgroundColor: color.bg }}
            ></div>

            {/* Bottom part (White bg) */}
            <div className="px-6 py-5 flex flex-col relative z-0 bg-white rounded-t-[20px] -mt-4">

                {/* Checkbox de selección múltiple */}
                {isSelectionMode && (
                    <div
                        className="absolute top-5 right-5 z-50 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onToggleSelect(area.id_area); }}
                    >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border-2 shadow-sm ${isSelected ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white' : 'bg-white border-slate-300 hover:border-[var(--color-brand-primary)]'}`}>
                            {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                    </div>
                )}

                {/* Title */}
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Área Académica
                </span>
                <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 truncate">
                    {area.nombre}
                </h3>

                {/* Separator with cutouts */}
                <div className="relative py-4 z-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dashed border-slate-200"></div>
                    </div>
                    {/* Cutouts (Colored same as body background #f8fafc) */}
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#f8fafc] rounded-full border border-slate-100"></div>
                    <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#f8fafc] rounded-full border border-slate-100"></div>
                </div>

                {/* Footer (Hours + Buttons) */}
                <div className="flex justify-between items-center">
                    {/* Hours */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Límite Diario</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-800 leading-none">{area.max_horas_dia}</span>
                            <span className="text-[11px] font-bold text-slate-500">horas</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(area); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 border border-red-600 text-red-600 text-[12px] font-bold rounded-full transition-colors shadow-sm cursor-pointer"
                        >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Eliminar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(area); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]  text-[var(--color-brand-primary)] text-[12px] font-bold rounded-full transition-colors shadow-sm cursor-pointer"
                        >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Editar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function AreasManager() {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentView, setCurrentView] = useState('list'); // 'list' o 'form'
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [deleteError, setDeleteError] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4500);
    };

    // Estado para modal de eliminar
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]);
    const [eliminando, setEliminando] = useState(false);

    // Selección múltiple
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const [nuevaArea, setNuevaArea] = useState({
        nombre: '',
        max_horas_dia: ''
    });

    const [searchTerm, setSearchTerm] = useState('');

    const filteredAreas = areas.filter(area =>
        area.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const volverALista = (push = true) => {
        setCurrentView('list');
        if (push) window.history.pushState(null, '', window.location.pathname + window.location.search);
    };

    // ── Abrir modal para nueva área ──
    const abrirModalNueva = (push = true) => {
        setIsEditing(false);
        setEditId(null);
        setNuevaArea({ nombre: '', max_horas_dia: '' });
        setFormErrors({});
        setCurrentView('form');
        if (push) window.history.pushState(null, '', '#new');
    };

    // ── Abrir modal para edición ──
    const abrirModalEdicion = (area, push = true) => {
        setIsEditing(true);
        setEditId(area.id_area);
        setNuevaArea({
            nombre: area.nombre,
            max_horas_dia: area.max_horas_dia || 4
        });
        setFormErrors({});
        setCurrentView('form');
        if (push) window.history.pushState(null, '', `#edit-${area.id_area}`);
    };

    // ── Cargar áreas del backend al montar ──
    const fetchAreas = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/areas`);
            if (!res.ok) throw new Error('Error al obtener las áreas');
            const data = await res.json();
            setAreas(data);
            setError(null);

            // Sincronizar hash de la URL con la vista actual
            const hash = window.location.hash;
            if (hash === '#new') {
                abrirModalNueva(false);
            } else if (hash.startsWith('#edit-')) {
                const id = hash.replace('#edit-', '');
                const area = data.find(a => a.id_area.toString() === id);
                if (area) {
                    abrirModalEdicion(area, false);
                } else {
                    volverALista(false);
                }
            } else {
                volverALista(false);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    // Escuchar cambios en el historial (botones Atrás/Adelante del navegador)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash === '#new') {
                abrirModalNueva(false);
            } else if (hash.startsWith('#edit-')) {
                const id = hash.replace('#edit-', '');
                const area = areas.find(a => a.id_area.toString() === id);
                if (area) {
                    abrirModalEdicion(area, false);
                } else {
                    volverALista(false);
                }
            } else {
                volverALista(false);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [areas]);

    // ── Preparar Eliminación (Abrir Modal) ──
    const eliminarArea = (area) => {
        setItemsToDelete([area.id_area]);
        setDeleteError(null);
        setIsDeleteModalOpen(true);
    };

    const openDeleteModal = (ids) => {
        setItemsToDelete(ids);
        setDeleteError(null);
        setIsDeleteModalOpen(true);
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    // ── Ejecutar Eliminación (DELETE endpoint) ──
    const confirmarEliminacion = async () => {
        if (!itemsToDelete || itemsToDelete.length === 0) return;
        setEliminando(true);
        setDeleteError(null);
        try {
            let errorMsg = null;
            for (let id of itemsToDelete) {
                const res = await fetch(`${API_BASE}/areas/${id}`, { method: 'DELETE' });
                if (!res.ok) {
                    try {
                        const errorData = await res.json();
                        errorMsg = errorData.detail || errorData.message || 'No se puede eliminar porque esta área está siendo usada.';
                    } catch (e) {
                        errorMsg = 'No se puede eliminar porque esta área está siendo usada.';
                    }
                    throw new Error(errorMsg);
                }
            }
            setAreas(areas.filter(a => !itemsToDelete.includes(a.id_area)));
            setSelectedIds(prev => prev.filter(id => !itemsToDelete.includes(id)));
            window.dispatchEvent(new Event('edusync_data_updated'));
            setIsDeleteModalOpen(false);
            setItemsToDelete([]);
        } catch (err) {
            setDeleteError(err.message);
        } finally {
            setEliminando(false);
        }
    };

    // ── Guardar área (POST al backend) ──
    const handleGuardar = async (e) => {
        e.preventDefault();

        // Validaciones visuales
        const errors = {};
        if (!nuevaArea.nombre || nuevaArea.nombre.trim() === '') {
            errors.nombre = "El nombre del área es obligatorio.";
        }
        if (!nuevaArea.max_horas_dia || isNaN(nuevaArea.max_horas_dia) || parseInt(nuevaArea.max_horas_dia) < 1) {
            errors.max_horas_dia = "Debes ingresar un número válido mayor a 0.";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setFormErrors({});
        setGuardando(true);

        try {
            if (isEditing) {
                // Edición (PUT endpoint)
                const res = await fetch(`${API_BASE}/areas/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nuevaArea.nombre,
                        max_horas_dia: parseInt(nuevaArea.max_horas_dia)
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Error al actualizar el área');
                }
                await fetchAreas();
            } else {
                // Crear nueva área via POST
                const res = await fetch(`${API_BASE}/areas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nuevaArea.nombre,
                        max_horas_dia: parseInt(nuevaArea.max_horas_dia)
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Error al crear el área');
                }

                // Recargar lista desde el backend para obtener el id real
                await fetchAreas();
            }

            window.dispatchEvent(new Event('edusync_data_updated'));
            volverALista();
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    // ── Helpers de normalización ──
    const norm = (str) => String(str || '').toLowerCase().replace(/\s+/g, ' ').trim();

    // ── Importar desde Excel (Hoja 1: Áreas y Cursos) ──
    const importarAreasYCursos = async (data, areasLocal, cursosList) => {
        let creados = 0;
        let errores = 0;
        const erroresDetalle = [];

        for (const row of data) {
            const nombreCurso = String(row['Nombre del Curso'] || '').trim();
            const nombreArea = String(row['Área'] || '').trim();
            const maxHoras = parseInt(row['Horas Máximas Diarias del Área']) || 2;

            if (!nombreCurso || !nombreArea) {
                errores++;
                erroresDetalle.push(`Fila sin nombre de curso o área`);
                continue;
            }

            try {
                // 1. Buscar o crear el área
                let areaId = null;
                const areaExistente = areasLocal.find(a => norm(a.nombre) === norm(nombreArea));

                if (areaExistente) {
                    areaId = areaExistente.id_area;
                } else {
                    const resArea = await fetch(`${API_BASE}/areas`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: nombreArea, max_horas_dia: maxHoras })
                    });
                    if (resArea.ok) {
                        const newArea = await resArea.json();
                        areaId = newArea.id_area;
                        areasLocal.push({ id_area: areaId, nombre: nombreArea, max_horas_dia: maxHoras });
                    } else {
                        errores++;
                        erroresDetalle.push(`Error creando área "${nombreArea}"`);
                        continue;
                    }
                }

                // 2. Crear el curso (verificar si ya existe)
                const cursoExistente = cursosList.find(c => norm(c.nombre_curso) === norm(nombreCurso));

                if (cursoExistente) {
                    continue; // Ya existe, lo saltamos
                }

                const resCurso = await fetch(`${API_BASE}/cursos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre_curso: nombreCurso,
                        id_area: areaId,
                        requiere_espacio_unico: false
                    })
                });

                if (resCurso.ok) {
                    const newCurso = await resCurso.json();
                    cursosList.push(newCurso);
                    creados++;
                } else {
                    errores++;
                    erroresDetalle.push(`Error creando curso "${nombreCurso}"`);
                }
            } catch (err) {
                errores++;
                erroresDetalle.push(`Error procesando "${nombreCurso}": ${err.message}`);
            }
        }

        return { creados, errores, erroresDetalle };
    };

    // ── Importar Docentes (Hoja 2) ──
    const importarDocentes = async (data, sedesList, gradosList, cursosList) => {
        let creados = 0;
        let actualizados = 0;
        let errores = 0;
        const erroresDetalle = [];

        // Cargar relaciones existentes para no duplicar
        const resProfesores = await fetch(`${API_BASE}/profesores`);
        const profesoresExistentes = resProfesores.ok ? await resProfesores.json() : [];
        const resPC = await fetch(`${API_BASE}/profesor-curso`);
        const profCursosExistentes = resPC.ok ? await resPC.json() : [];
        const resPS = await fetch(`${API_BASE}/profesor-sedes`);
        const profSedesExistentes = resPS.ok ? await resPS.json() : [];
        const resGP = await fetch(`${API_BASE}/grado-profesor`);
        const gradoProfExistentes = resGP.ok ? await resGP.json() : [];

        for (const row of data) {
            const nombreProf = String(row['Nombre Completo del Docente'] || '').trim();
            if (!nombreProf) {
                errores++;
                erroresDetalle.push('Fila sin nombre de docente');
                continue;
            }

            const sedesTexto = String(row['Sedes (separar con coma)'] || '').trim();
            const gradosTexto = String(row['Grados (separar con coma)'] || '').trim();
            const cursosTexto = String(row['Cursos que Dicta (separar con coma)'] || '').trim();

            try {
                // ── PASO 1: Crear perfil del profesor (si no existe) ──
                let profExistente = profesoresExistentes.find(p => norm(p.nombre_profesor) === norm(nombreProf));
                let profId;
                let fueCreado = false;

                if (profExistente) {
                    profId = profExistente.id_profesor;
                } else {
                    const resProf = await fetch(`${API_BASE}/profesores`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre_profesor: nombreProf, horas_minimas: 0 })
                    });
                    if (!resProf.ok) {
                        errores++;
                        erroresDetalle.push(`Error creando docente "${nombreProf}"`);
                        continue;
                    }
                    const newProf = await resProf.json();
                    profId = newProf.id_profesor;
                    profesoresExistentes.push(newProf);
                    fueCreado = true;
                }

                // ── PASO 2: Vincular Sedes y Grados (Alcance Académico) ──
                if (sedesTexto) {
                    const sedesNombres = sedesTexto.split(',').map(s => s.trim()).filter(Boolean);
                    for (const sedeNombre of sedesNombres) {
                        const sedeMatch = sedesList.find(s => norm(s.nombre_sede || s.nombre) === norm(sedeNombre));
                        if (!sedeMatch) {
                            erroresDetalle.push(`Docente "${nombreProf}": Sede "${sedeNombre}" no encontrada en el sistema.`);
                            continue;
                        }
                        // Verificar si ya tiene esta sede asignada
                        const yaAsignada = profSedesExistentes.some(ps => ps.id_profesor === profId && ps.id_sede === sedeMatch.id_sede);
                        if (!yaAsignada) {
                            const res = await fetch(`${API_BASE}/profesor-sedes`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id_profesor: profId, id_sede: sedeMatch.id_sede })
                            });
                            if (res.ok) {
                                const newRel = await res.json();
                                profSedesExistentes.push(newRel);
                            }
                        }
                    }
                }

                if (gradosTexto) {
                    const gradosNombres = gradosTexto.split(',').map(s => s.trim()).filter(Boolean);
                    for (const gradoNombre of gradosNombres) {
                        // Buscar por número o por nombre normalizado
                        const gradoMatch = gradosList.find(g => {
                            const numStr = String(g.numero);
                            const nombreCheck = norm(gradoNombre);
                            return numStr === nombreCheck || norm(`Grado ${g.numero}`) === nombreCheck || norm(`${g.numero}`) === nombreCheck;
                        });
                        if (!gradoMatch) {
                            erroresDetalle.push(`Docente "${nombreProf}": Grado "${gradoNombre}" no encontrado en el sistema.`);
                            continue;
                        }
                        const yaAsignado = gradoProfExistentes.some(gp => gp.id_profesor === profId && gp.id_grado === gradoMatch.id_grado);
                        if (!yaAsignado) {
                            const res = await fetch(`${API_BASE}/grado-profesor`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id_profesor: profId, id_grado: gradoMatch.id_grado })
                            });
                            if (res.ok) {
                                const newRel = await res.json();
                                gradoProfExistentes.push(newRel);
                            }
                        }
                    }
                }

                // ── PASO 3: Vincular Cursos (Carga Académica) ──
                if (cursosTexto) {
                    const cursosNombres = cursosTexto.split(',').map(s => s.trim()).filter(Boolean);
                    for (const cursoNombre of cursosNombres) {
                        const cursoMatch = cursosList.find(c => norm(c.nombre_curso) === norm(cursoNombre));
                        if (!cursoMatch) {
                            erroresDetalle.push(`Docente "${nombreProf}": Curso "${cursoNombre}" no encontrado. Verifica que esté en la hoja de Áreas y Cursos.`);
                            continue;
                        }
                        const yaAsignado = profCursosExistentes.some(pc => pc.id_profesor === profId && pc.id_curso === cursoMatch.id_curso);
                        if (!yaAsignado) {
                            const res = await fetch(`${API_BASE}/profesor-curso`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id_profesor: profId, id_curso: cursoMatch.id_curso })
                            });
                            if (res.ok) {
                                const newRel = await res.json();
                                profCursosExistentes.push(newRel);
                            }
                        }
                    }
                }

                if (fueCreado) {
                    creados++;
                } else {
                    actualizados++;
                }
            } catch (err) {
                errores++;
                erroresDetalle.push(`Error procesando "${nombreProf}": ${err.message}`);
            }
        }

        return { creados, actualizados, errores, erroresDetalle };
    };

    // ── Generar Plantilla Personalizada (Concisa y Combinada) ──
    const generarPlantillaPersonalizada = async () => {
        // Cargar datos del sistema para los catálogos
        let sedesList = [], gradosList = [], cursosList = [];
        try {
            const [resSedes, resGrados, resCursos] = await Promise.all([
                fetch(`${API_BASE}/sedes`).catch(() => ({ ok: false })),
                fetch(`${API_BASE}/grados`).catch(() => ({ ok: false })),
                fetch(`${API_BASE}/cursos`).catch(() => ({ ok: false })),
            ]);
            sedesList = resSedes.ok ? await resSedes.json() : [];
            gradosList = resGrados.ok ? await resGrados.json() : [];
            cursosList = resCursos.ok ? await resCursos.json() : [];
        } catch (e) { /* silencioso */ }

        const wb = XLSX.utils.book_new();

        // ═══════════════════════════════════════════
        // HOJA 1: Áreas y Cursos
        // ═══════════════════════════════════════════
        const hoja1Data = [
            ['Nombre del Curso', 'Área', 'Horas Máximas Diarias del Área'],
            ['Razonamiento Matemático', 'Matemáticas', 2],
            ['Comunicación', 'Lenguaje', 3],
            [],
            ['⚠️ INSTRUCCIONES PARA LLENAR ESTA HOJA (Borrar antes de subir):'],
            ['1. Borra las filas de ejemplo (filas 2 y 3) antes de subir tu archivo.'],
            ['2. En "Nombre del Curso", escribe el nombre de la materia (Ej: Álgebra).'],
            ['3. En "Área", pon el grupo al que pertenece. Si el área ya existe, el curso se guardará automáticamente ahí.'],
            ['4. Si el área es NUEVA, el sistema la creará. Solo en este caso, usa la 3ra columna para indicar el límite de horas diarias.']
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(hoja1Data);
        ws1['!cols'] = [{ wch: 35 }, { wch: 30 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Áreas y Cursos');

        // ═══════════════════════════════════════════
        // HOJA 2: Docentes (con Catálogos integrados)
        // ═══════════════════════════════════════════
        const ejemploSedes = sedesList.length > 0 ? sedesList.slice(0, 2).map(s => s.nombre_sede || s.nombre).join(', ') : 'Sede Central, Sede Norte';
        const ejemploGrados = gradosList.length > 0 ? gradosList.slice(0, 3).map(g => g.numero).join(', ') : '1, 2, 3';
        const ejemploCursos = cursosList.length > 0 ? cursosList.slice(0, 2).map(c => c.nombre_curso).join(', ') : 'Álgebra, Comunicación';

        const hoja2Data = [];
        // Empezamos los catálogos en la fila 3 (índice 3), así que sumamos 3 al número de elementos
        const maxRows = Math.max(8, sedesList.length + 4, gradosList.length + 4, cursosList.length + 4);

        for (let i = 0; i < maxRows; i++) {
            let row = [];

            // Llenar columnas de Catálogos (F, G y H) alineadas a partir de la fila 3
            if (i === 3) {
                row[4] = '📌 SEDES EXISTENTES (No borrar)';
                row[5] = '📌 GRADOS EXISTENTES (No borrar)';
                row[6] = '📌 CURSOS REGISTRADOS (No borrar)';
            } else if (i > 3) {
                const sedeVal = sedesList[i - 4] ? (sedesList[i - 4].nombre_sede || sedesList[i - 4].nombre) : null;
                const gradoVal = gradosList[i - 4] ? String(gradosList[i - 4].numero) : null;
                const cursoVal = cursosList[i - 4] ? cursosList[i - 4].nombre_curso : null;

                if (sedeVal) row[4] = sedeVal;
                if (gradoVal) row[5] = gradoVal;
                if (cursoVal) row[6] = cursoVal;
            }

            // Llenar datos principales e instrucciones (A - D)
            if (i === 0) {
                row[0] = 'Nombre Completo del Docente';
                row[1] = 'Sedes (separar con coma)';
                row[2] = 'Grados (separar con coma)';
                row[3] = 'Cursos (separar con coma)';
            } else if (i === 1) {
                row[0] = 'Juan Pérez García';
                row[1] = ejemploSedes;
                row[2] = ejemploGrados;
                row[3] = ejemploCursos;
            } else if (i === 3) {
                row[0] = '⚠️ INSTRUCCIONES PARA LLENAR ESTA HOJA (Borrar textos antes de subir):';
            } else if (i === 4) {
                row[0] = '1. Elimina la fila de ejemplo (fila 2) antes de importar.';
            } else if (i === 5) {
                row[0] = '2. En "Nombre Completo", escribe el nombre. Si el docente ya existe, solo se actualizarán sus datos (no se duplicará).';
            } else if (i === 6) {
                row[0] = '3. Para "Sedes" y "Grados", usa EXACTAMENTE los nombres que están en las listas de la derecha. Si son varios, usa comas.';
            } else if (i === 7) {
                row[0] = '4. CRÍTICO: En "Cursos", debes COPIAR LOS NOMBRES EXACTAMENTE IGUALES a como los pusiste en la hoja "Áreas y Cursos" o los de la derecha. ->';
            }

            hoja2Data.push(row);
        }

        const ws2 = XLSX.utils.aoa_to_sheet(hoja2Data);
        // Columnas: A(45), B(35), C(35), D(40), E(35 - Sedes), F(35 - Grados), G(45 - Cursos)
        ws2['!cols'] = [{ wch: 45 }, { wch: 35 }, { wch: 35 }, { wch: 40 }, { wch: 35 }, { wch: 35 }, { wch: 45 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Docentes');

        XLSX.writeFile(wb, 'plantilla_importacion.xlsx');
    };

    // ── Importar Excel Multi-Hoja (recibe el workbook completo) ──
    const handleCustomImport = async (workbook) => {
        let resumenAreas = { creados: 0, errores: 0, erroresDetalle: [] };
        let resumenDocentes = { creados: 0, actualizados: 0, errores: 0, erroresDetalle: [] };

        // Cargar datos frescos del sistema
        const resCursos = await fetch(`${API_BASE}/cursos`);
        const cursosList = resCursos.ok ? await resCursos.json() : [];
        const areasLocal = [...areas];

        // ── Procesar Hoja 1: Áreas y Cursos ──
        const hoja1Name = workbook.SheetNames.find(n => norm(n).includes('area') || norm(n).includes('curso')) || workbook.SheetNames[0];
        if (hoja1Name && workbook.Sheets[hoja1Name]) {
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[hoja1Name], { defval: '' });
            const validData = jsonData.filter(row => {
                const firstVal = String(Object.values(row)[0] || '').trim();
                return firstVal && !firstVal.startsWith('═') && !firstVal.startsWith('─') && !firstVal.startsWith('PASO') && !firstVal.startsWith('INSTRUCCIONES') && !firstVal.startsWith('EJEMPLO') && !firstVal.startsWith('NOTA');
            });
            if (validData.length > 0) {
                resumenAreas = await importarAreasYCursos(validData, areasLocal, cursosList);
            }
        }

        // ── Procesar Hoja 2: Docentes ──
        const hoja2Name = workbook.SheetNames.find(n => norm(n).includes('docente') || norm(n).includes('profesor'));
        if (hoja2Name && workbook.Sheets[hoja2Name]) {
            // Cargar sedes y grados para validación
            const [resSedes, resGrados] = await Promise.all([
                fetch(`${API_BASE}/sedes`).catch(() => ({ ok: false })),
                fetch(`${API_BASE}/grados`).catch(() => ({ ok: false })),
            ]);
            const sedesList = resSedes.ok ? await resSedes.json() : [];
            const gradosList = resGrados.ok ? await resGrados.json() : [];

            // Refrescar cursos después de crear los de la hoja 1
            const resCursosRefresh = await fetch(`${API_BASE}/cursos`);
            const cursosRefreshed = resCursosRefresh.ok ? await resCursosRefresh.json() : cursosList;

            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[hoja2Name], { defval: '' });
            const validData = jsonData.filter(row => {
                const firstVal = String(Object.values(row)[0] || '').trim();
                return firstVal && !firstVal.startsWith('═') && !firstVal.startsWith('─') && !firstVal.startsWith('PASO') && !firstVal.startsWith('INSTRUCCIONES') && !firstVal.startsWith('NOTA');
            });
            if (validData.length > 0) {
                resumenDocentes = await importarDocentes(validData, sedesList, gradosList, cursosRefreshed);
            }
        }

        // Refrescar datos
        await fetchAreas();
        window.dispatchEvent(new Event('edusync_data_updated'));

        // Mostrar resultados
        // Mostrar resultados
        const totalCreados = resumenAreas.creados + resumenDocentes.creados;
        const totalActualizados = resumenDocentes.actualizados;
        const totalErrores = resumenAreas.errores + resumenDocentes.errores;
        const todosDetalles = [...resumenAreas.erroresDetalle, ...resumenDocentes.erroresDetalle];

        let mensaje = '';
        if (resumenAreas.creados > 0) mensaje += `${resumenAreas.creados} cursos importados. `;
        if (resumenDocentes.creados > 0) mensaje += `${resumenDocentes.creados} docentes creados. `;
        if (resumenDocentes.actualizados > 0) mensaje += `${resumenDocentes.actualizados} docentes actualizados. `;

        if (totalCreados === 0 && totalActualizados === 0 && totalErrores === 0) {
            mensaje = 'No se encontraron datos nuevos para importar.';
        }

        if (todosDetalles.length > 0) mensaje += `${todosDetalles.length} advertencia(s).`;

        showToast(mensaje, totalErrores > 0 && totalCreados === 0 && totalActualizados === 0 ? 'error' : 'success');

        if (todosDetalles.length > 0) {
            console.warn('Detalles de importación:', todosDetalles);
        }

        return { success: totalErrores === 0, message: '' };
    };

    const areasExcelColumns = [
        { header: 'Nombre del Curso', example: 'Razonamiento Matemático', key: 'nombre_curso' },
        { header: 'Área', example: 'Matemáticas', key: 'nombre_area' },
        { header: 'Horas Máximas Diarias del Área', example: 2, key: 'max_horas_dia' }
    ];

    return (
        <div className="w-full animate-fade-in relative">
            {toast.show && (
                <div
                    className="fixed top-24 right-8 z-[200] px-5 py-3 rounded-2xl shadow-lg border text-[14px] font-bold flex items-center gap-2.5"
                    style={{
                        backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                        borderColor: toast.type === 'error' ? '#fca5a5' : '#86efac',
                        color: toast.type === 'error' ? '#dc2626' : '#16a34a',
                        animation: 'slideInRight 0.3s ease-out'
                    }}
                >
                    {toast.type === 'error' ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                    )}
                    {toast.message}
                </div>
            )}
            <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-144px)]">

                {/* ===== LEFT SIDEBAR (1/4) ===== */}
                <ModuleSidebar
                    title="Gestión de Áreas"
                    description="Crea las áreas académicas de tu institución y define cuántas horas de clase tendrán al día como máximo."
                    onAddClick={abrirModalNueva}
                    addButtonText="Añadir Nueva Área"
                    svgImage="/areas.svg"
                >
                    <ExcelImportPanel
                        templateColumns={areasExcelColumns}
                        templateFileName="plantilla_importacion_completa.xlsx"
                        onImport={() => { }}
                        title="Importar Áreas, Cursos y Docentes"
                        onCustomTemplate={generarPlantillaPersonalizada}
                        onCustomImport={handleCustomImport}
                    />
                </ModuleSidebar>

                {/* ===== RIGHT CONTENT (3/4) ===== */}
                <main className="md:w-3/4 flex flex-col gap-5">
                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            <p className="text-sm font-medium">No se pudo conectar al servidor: {error}</p>
                            <button onClick={fetchAreas} className="ml-auto text-xs font-bold text-red-600 hover:underline cursor-pointer">Reintentar</button>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-[var(--color-brand-primary)]/30 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Content Views */}
                    {!loading && (
                        <>
                            {currentView === 'list' ? (
                                // --- VISTA LISTA ---
                                <>
                                    {/* Title */}
                                    <div className=" px-2 flex">
                                        <h2 className="text-slate-800 text-[20px] font-black">Total  areas: {areas.length} registradas</h2>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                                        <div className="flex items-center flex-1 bg-slate-50 rounded-[16px] h-14 px-4 border border-slate-200 focus-within:border-[var(--color-brand-primary)] focus-within:ring-4 focus-within:ring-[var(--color-brand-primary)]/10 transition-all">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                            <input
                                                type="text"
                                                placeholder="Buscar área por nombre..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="flex-1 bg-transparent pl-3 pr-2 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full min-w-0"
                                            />
                                            {searchTerm && (
                                                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50 flex-shrink-0 cursor-pointer">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 justify-end flex-shrink-0">
                                            <button
                                                onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedIds([]); }}
                                                className={`h-14 text-[12px] font-bold transition-all cursor-pointer px-5 rounded-[14px] flex items-center justify-center gap-2 border whitespace-nowrap
                                                    ${isSelectionMode
                                                        ? 'bg-[var(--color-brand-dark)] border-[var(--color-brand-dark)] text-white hover:bg-[var(--color-brand-primary)]'
                                                        : 'bg-transparent hover:bg-[var(--color-brand-primary)]/5 border-slate-300 text-slate-600 hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${isSelectionMode ? 'bg-white/20 border-white/30 text-white' : 'bg-white border-slate-300'}`}>
                                                    {isSelectionMode && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                                </div>
                                                {isSelectionMode ? 'Cancelar' : 'Seleccionar'}
                                            </button>
                                            {isSelectionMode && (
                                                <button
                                                    onClick={() => selectedIds.length > 0 && openDeleteModal(selectedIds)}
                                                    disabled={selectedIds.length === 0}
                                                    className={`h-14 text-[12px] font-bold px-5 rounded-[14px] transition-all flex items-center gap-2 border whitespace-nowrap
                                                        ${selectedIds.length > 0
                                                            ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 cursor-pointer'
                                                            : 'bg-red-50 text-red-300 border-red-100 opacity-60 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    Eliminar {selectedIds.length > 0 && `(${selectedIds.length})`}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Grid */}
                                    {areas.length === 0 ? (
                                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[24px] p-16 text-center flex-1 flex flex-col items-center justify-center animate-fade-in">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800">No hay áreas registradas</h3>
                                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Comienza creando tu primera área académica usando el botón de la izquierda.</p>
                                        </div>
                                    ) : filteredAreas.length === 0 ? (
                                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[24px] p-16 text-center flex-1 flex flex-col items-center justify-center animate-fade-in">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800">No se encontraron áreas</h3>
                                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">No hay ningún resultado que coincida con tu búsqueda.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10 animate-fade-in">
                                            {filteredAreas.map((area, index) => (
                                                <AreaFolderCard
                                                    key={area.id_area}
                                                    area={area}
                                                    index={index}
                                                    onEdit={abrirModalEdicion}
                                                    onDelete={eliminarArea}
                                                    isSelected={selectedIds.includes(area.id_area)}
                                                    onToggleSelect={handleToggleSelect}
                                                    isSelectionMode={isSelectionMode}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                // --- VISTA FORMULARIO ---
                                <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 animate-fade-in">
                                    <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                {isEditing ? (
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                ) : (
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                )}
                                            </div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{isEditing ? 'Editar Área Académica' : 'Registrar Nueva Área'}</h2>
                                        </div>
                                        <button
                                            onClick={() => volverALista()}
                                            className="cursor-pointer text-[var(--color-brand-primary)] hover:text-[var(--color-brand-dark)] transition-colors flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                            Volver
                                        </button>
                                    </div>

                                    <form onSubmit={handleGuardar} className="space-y-8 max-w-4xl" noValidate>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Nombre del Área */}
                                            <div className="space-y-2">
                                                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre del Área</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`${formErrors.nombre ? 'text-red-400' : 'text-slate-400'} stroke-2`}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                                    </div>
                                                    <input
                                                        required
                                                        type="text"
                                                        placeholder="Ej. Ciencias Exactas"
                                                        value={nuevaArea.nombre}
                                                        onChange={(e) => {
                                                            setNuevaArea({ ...nuevaArea, nombre: e.target.value });
                                                            if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: null });
                                                        }}
                                                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${formErrors.nombre ? 'border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'border-slate-200 focus:border-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]/10'} focus:ring-4 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400`}
                                                    />
                                                </div>
                                                {formErrors.nombre && (
                                                    <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1 animate-fade-in">{formErrors.nombre}</p>
                                                )}
                                            </div>

                                            {/* Límite de Horas */}
                                            <div className="space-y-2">
                                                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider ml-1">Límite Diario (Horas)</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`${formErrors.max_horas_dia ? 'text-red-400' : 'text-slate-400'} stroke-2`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                    <input
                                                        required
                                                        type="number"
                                                        min="1"
                                                        max="12"
                                                        placeholder="Máx. horas por día"
                                                        value={nuevaArea.max_horas_dia}
                                                        onChange={(e) => {
                                                            setNuevaArea({ ...nuevaArea, max_horas_dia: e.target.value });
                                                            if (formErrors.max_horas_dia) setFormErrors({ ...formErrors, max_horas_dia: null });
                                                        }}
                                                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${formErrors.max_horas_dia ? 'border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'border-slate-200 focus:border-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]/10'} focus:ring-4 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400`}
                                                    />
                                                </div>
                                                {formErrors.max_horas_dia && (
                                                    <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1 animate-fade-in">{formErrors.max_horas_dia}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => volverALista()}
                                                className="cursor-pointer py-3.5 px-6 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={guardando}
                                                className="cursor-pointer py-3.5 px-8 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)] text-white text-sm font-bold rounded-xl shadow-md shadow-[var(--color-brand-primary)]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {guardando ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Guardando...
                                                    </>
                                                ) : (
                                                    <>
                                                        {isEditing ? 'Guardar Cambios' : 'Añadir Registro'}
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Modal Confirmación de Eliminar */}
            {isDeleteModalOpen && itemsToDelete.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
                    <div
                        className="bg-white rounded-[24px] shadow-2xl w-full max-w-[340px] overflow-hidden transform animate-slide-up p-8 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icono de advertencia */}
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h2 className="text-[20px] font-extrabold text-slate-800 mb-2">
                            {itemsToDelete.length > 1 ? `Eliminar ${itemsToDelete.length} áreas` : 'Eliminar Área'}
                        </h2>
                        <p className="text-slate-500 text-[14px] font-medium mb-6 leading-relaxed">
                            {itemsToDelete.length > 1
                                ? `Estás a punto de eliminar ${itemsToDelete.length} áreas. ¿Estás seguro?`
                                : `Estás a punto de eliminar el área seleccionada. ¿Estás seguro?`
                            }
                        </p>

                        {deleteError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-[13px] font-medium mb-6 text-left">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setItemsToDelete([]);
                                }}
                                disabled={eliminando}
                                className="cursor-pointer flex-1 py-3 text-[13px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all disabled:opacity-50"
                            >
                                No, Conservarla
                            </button>
                            <button
                                type="button"
                                onClick={confirmarEliminacion}
                                disabled={eliminando}
                                className="cursor-pointer flex-1 py-3 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-[13px] font-bold rounded-full shadow-[0_4px_12px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_16px_rgba(244,63,94,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {eliminando ? 'Eliminando...' : 'Sí, ¡Eliminar!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
