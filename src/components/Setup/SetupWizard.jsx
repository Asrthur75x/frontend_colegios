import React, { useState, useEffect, useRef } from 'react';
import Paso1Institucion from './Steps/Paso1Institucion';
import Paso2DiasGrados from './Steps/Paso2DiasGrados';
import Paso3GradoDiaConfig from './Steps/Paso3GradoDiaConfig';
import Paso4Secciones from './Steps/Paso4Secciones';
import Paso5Turnos from './Steps/Paso5Turnos';
import Paso6Tutoria from './Steps/Paso6Tutoria';

const DEFAULT_DATA = {
    colegio: { nombre: '' },
    tipo_sede: null,
    numero_sedes: 1,
    sedes: [''],
    turnos: [],
    dias: [],
    grados: [],
    gradoDiaConfig: null,
    secciones: null,
    seccionTurno: null,
    tutoria: null
};



function getSavedStep() {
    if (typeof window === 'undefined') return 1;
    try {
        const s = sessionStorage.getItem('edusync_wizard_step');
        return s ? parseInt(s, 10) : 1;
    } catch { return 1; }
}

function getSavedData() {
    if (typeof window === 'undefined') return DEFAULT_DATA;
    try {
        const d = sessionStorage.getItem('edusync_wizard_data');
        return d ? JSON.parse(d) : DEFAULT_DATA;
    } catch { return DEFAULT_DATA; }
}

function getSavedSteps() {
    if (typeof window === 'undefined') return [];
    try {
        const s = sessionStorage.getItem('edusync_wizard_saved_steps');
        return s ? JSON.parse(s) : [];
    } catch { return []; }
}

export default function SetupWizard() {
    const [step, setStep] = useState(1);
    const [wizardData, setWizardData] = useState(DEFAULT_DATA);
    const [savedSteps, setSavedSteps] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false); // guardia para no sobreescribir localStorage en el primer render
    const [errorMsg, setErrorMsg] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const errorTimeoutRef = useRef(null);

    const showError = (msg) => {
        setErrorMsg(msg);
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = setTimeout(() => {
            setErrorMsg('');
        }, 4000);
    };

    useEffect(() => {
        setErrorMsg('');
        setFieldErrors({});
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }
    }, [step]);
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [entered, setEntered] = useState(false);
    const [editingSteps, setEditingSteps] = useState([]);
    const [wizardDataBackup, setWizardDataBackup] = useState(null);

    const totalSteps = wizardData.turnos && wizardData.turnos.length > 1 ? 7 : 6;

    // Cargar desde sessionStorage solo en el cliente (después de montar)
    useEffect(() => {
        // Limpiar claves viejas de localStorage (migración a sessionStorage)
        try {
            localStorage.removeItem('edusync_wizard_step');
            localStorage.removeItem('edusync_wizard_data');
            localStorage.removeItem('edusync_wizard_saved_steps');
        } catch (_) { }

        // Cargar datos inicialmente
        setStep(getSavedStep());
        setWizardData(getSavedData());
        setSavedSteps(getSavedSteps());

        // Verificar si la base de datos fue limpiada externamente
        fetch('http://127.0.0.1:8000/api/colegio')
            .then(res => res.json())
            .then(async (colegios) => {
                if (colegios.length === 0 || !colegios[0].nombre_colegio) {
                    // Si no hay colegio o su nombre está vacío, forzamos un reseteo de la sesión
                    sessionStorage.removeItem('edusync_wizard_step');
                    sessionStorage.removeItem('edusync_wizard_data');
                    sessionStorage.removeItem('edusync_wizard_saved_steps');
                    setStep(1);
                    setWizardData(DEFAULT_DATA);
                    setSavedSteps([]);
                    setDataLoaded(true);
                } else {
                    // Si el colegio existe en la BD pero no hay sesión guardada (e.g. cerró la pestaña),
                    // restauramos el progreso desde el backend para evitar crear duplicados.
                    const sStep = sessionStorage.getItem('edusync_wizard_step');
                    if (!sStep) {
                        let newWizardData = JSON.parse(JSON.stringify(DEFAULT_DATA));
                        let newSavedSteps = [];
                        let finalStep = 1;

                        newWizardData.colegio.nombre = colegios[0].nombre_colegio;

                        try {
                            const sedesRes = await fetch('http://127.0.0.1:8000/api/sedes');
                            const sedesDb = await sedesRes.json();

                            const turnosRes = await fetch('http://127.0.0.1:8000/api/turnos');
                            const turnosDb = await turnosRes.json();

                            if (sedesDb.length > 0 && turnosDb.length > 0) {
                                newWizardData.sedes = sedesDb.map(s => s.nombre_sede);
                                newWizardData.turnos = turnosDb.map(t => t.nombre);
                                newWizardData.tipo_sede = sedesDb.length > 1 ? 'multiple' : 'unica';
                                newWizardData.numero_sedes = sedesDb.length;
                                newSavedSteps.push(1);
                                finalStep = 2;
                            }

                            const diasRes = await fetch('http://127.0.0.1:8000/api/dias');
                            const diasDb = await diasRes.json();

                            const gradosRes = await fetch('http://127.0.0.1:8000/api/grados');
                            const gradosDb = await gradosRes.json();

                            if (diasDb.length > 0 && gradosDb.length > 0) {
                                // newWizardData.dias = diasDb.map(d => ({ id: d.orden, nombre: d.nombre_dia }));
                                newWizardData.grados = gradosDb.map(g => g.numero);
                                newSavedSteps.push(2);
                                finalStep = 3;
                            }

                            const configRes = await fetch('http://127.0.0.1:8000/api/grado-dia-config');
                            if (configRes.ok) {
                                const configDb = await configRes.json();
                                if (configDb.length > 0) {
                                    newWizardData.gradoDiaConfig = {};
                                    configDb.forEach(c => {
                                        const g = gradosDb.find(g => g.id_grado === c.id_grado);
                                        const d = diasDb.find(d => d.id_dia === c.id_dia);
                                        if (g && d) {
                                            newWizardData.gradoDiaConfig[`${g.numero}-${d.orden}`] = c.bloques_dia;
                                        }
                                    });
                                }
                            }

                            const seccionesRes = await fetch('http://127.0.0.1:8000/api/secciones');
                            if (seccionesRes.ok) {
                                const seccionesDb = await seccionesRes.json();
                                if (seccionesDb.length > 0) {
                                    newWizardData.secciones = {};
                                    sedesDb.forEach(s => {
                                        newWizardData.secciones[s.nombre_sede] = {};
                                    });
                                    seccionesDb.forEach(sec => {
                                        const s = sedesDb.find(s => s.id_sede === sec.id_sede);
                                        const g = gradosDb.find(g => g.id_grado === sec.id_grado);
                                        if (s && g) {
                                            const sName = s.nombre_sede;
                                            const gNum = g.numero;
                                            if (!newWizardData.secciones[sName][gNum]) {
                                                newWizardData.secciones[sName][gNum] = [];
                                            }
                                            newWizardData.secciones[sName][gNum].push(sec.nombre);
                                        }
                                    });
                                    newSavedSteps.push(3);
                                    finalStep = 4;
                                }
                            }

                            // Verificar si existe seccion-turno (Paso 5)
                            const secTurnoRes = await fetch('http://127.0.0.1:8000/api/seccion-turno');
                            if (secTurnoRes.ok) {
                                const secTurnoDb = await secTurnoRes.json();
                                if (secTurnoDb.length > 0) {
                                    newSavedSteps.push(4);
                                    
                                    // Check Tutoria (Step 6)
                                    const tutoriaFlag = localStorage.getItem('edusync_tutoria_configured');
                                    if (tutoriaFlag) {
                                        window.location.href = '/dashboard';
                                        return;
                                    } else {
                                        newSavedSteps.push(5);
                                        finalStep = 6;
                                    }
                                } else if (finalStep === 4 && newWizardData.secciones) {
                                    // Si existen secciones pero no seccion-turno, avanzamos al paso 5
                                    newSavedSteps.push(4);
                                    finalStep = 5;
                                }
                            }

                            setStep(finalStep);
                            setWizardData(newWizardData);
                            setSavedSteps(newSavedSteps);
                        } catch (e) {
                            console.error("Error restaurando datos del backend:", e);
                        }
                    }
                    setDataLoaded(true);
                }
            })
            .catch(err => {
                console.error("Error validando la BD:", err);
                setDataLoaded(true);
            });

        const t1 = setTimeout(() => setMounted(true), 30);
        const t2 = setTimeout(() => setEntered(true), 60);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Persistir en sessionStorage — solo DESPUÉS de que los datos hayan sido cargados
    useEffect(() => {
        if (!dataLoaded) return;
        if (typeof window === 'undefined') return;
        try {
            sessionStorage.setItem('edusync_wizard_step', step.toString());
            sessionStorage.setItem('edusync_wizard_data', JSON.stringify(wizardData));
            sessionStorage.setItem('edusync_wizard_saved_steps', JSON.stringify(savedSteps));
        } catch (e) {
            console.warn('No se pudo guardar en sessionStorage', e);
        }
    }, [step, wizardData, savedSteps, dataLoaded]);

    const saveStep1Data = async () => {
        setIsSaving(true);
        try {
            let colResponse = await fetch('http://127.0.0.1:8000/api/colegio');
            let colegios = await colResponse.json();
            let colId = 1;

            if (colegios.length > 0) {
                colId = colegios[0].id_colegio;
                await fetch(`http://127.0.0.1:8000/api/colegio/${colId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_colegio: wizardData.colegio.nombre })
                });
            }

            let sedesResDb = await fetch('http://127.0.0.1:8000/api/sedes');
            let sedesDbList = await sedesResDb.json();

            // Eliminar sedes que fueron deseleccionadas
            const sedesABorrar = sedesDbList.filter(dbS => !wizardData.sedes.includes(dbS.nombre_sede));
            if (sedesABorrar.length > 0) {
                const secResDb = await fetch('http://127.0.0.1:8000/api/secciones');
                if (secResDb.ok) {
                    const secDbList = await secResDb.json();
                    const secABorrar = secDbList.filter(s => sedesABorrar.some(dbS => dbS.id_sede === s.id_sede));
                    if (secABorrar.length > 0) {
                        const stResDb = await fetch('http://127.0.0.1:8000/api/seccion-turno');
                        if (stResDb.ok) {
                            const stDbList = await stResDb.json();
                            const stABorrar = stDbList.filter(st => secABorrar.some(s => s.id_seccion === st.id_seccion));
                            for (const st of stABorrar) {
                                await fetch(`http://127.0.0.1:8000/api/seccion-turno/${st.id_seccion_turno}`, { method: 'DELETE' });
                            }
                        }
                        for (const s of secABorrar) {
                            await fetch(`http://127.0.0.1:8000/api/secciones/${s.id_seccion}`, { method: 'DELETE' });
                        }
                    }
                }
                for (const dbS of sedesABorrar) {
                    await fetch(`http://127.0.0.1:8000/api/sedes/${dbS.id_sede}`, { method: 'DELETE' });
                }
            }

            for (let sedeNombre of wizardData.sedes) {
                if (sedeNombre.trim() && !sedesDbList.some(s => s.nombre_sede === sedeNombre)) {
                    await fetch('http://127.0.0.1:8000/api/sedes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre_sede: sedeNombre, id_colegio: colId })
                    });
                }
            }

            let turnosResDb = await fetch('http://127.0.0.1:8000/api/turnos');
            let turnosDbList = await turnosResDb.json();

            // Eliminar turnos que fueron deseleccionados
            const turnosABorrar = turnosDbList.filter(dbT => !wizardData.turnos.includes(dbT.nombre));
            if (turnosABorrar.length > 0) {
                const stResDb = await fetch('http://127.0.0.1:8000/api/seccion-turno');
                if (stResDb.ok) {
                    const stDbList = await stResDb.json();
                    const stABorrar = stDbList.filter(st => turnosABorrar.some(dbT => dbT.id_turno === st.id_turno));
                    for (const st of stABorrar) {
                        await fetch(`http://127.0.0.1:8000/api/seccion-turno/${st.id_seccion_turno}`, { method: 'DELETE' });
                    }
                }
                const bloquesRes = await fetch('http://127.0.0.1:8000/api/bloques');
                if (bloquesRes.ok) {
                    const bloquesDb = await bloquesRes.json();
                    const bloquesABorrar = bloquesDb.filter(b => turnosABorrar.some(dbT => dbT.id_turno === b.id_turno));
                    for (const b of bloquesABorrar) {
                        await fetch(`http://127.0.0.1:8000/api/bloques/${b.id_bloque}`, { method: 'DELETE' });
                    }
                }
                for (const dbT of turnosABorrar) {
                    await fetch(`http://127.0.0.1:8000/api/turnos/${dbT.id_turno}`, { method: 'DELETE' });
                }
            }

            for (let t of wizardData.turnos) {
                if (!turnosDbList.some(dbT => dbT.nombre === t)) {
                    await fetch('http://127.0.0.1:8000/api/turnos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: t })
                    });
                }
            }

            setSavedSteps(prev => prev.includes(1) ? prev : [...prev, 1]);
            setEditingSteps(prev => prev.filter(s => s !== 1));
            setStep(prev => prev + 1);
        } catch (error) {
            console.error("Error al guardar en el backend:", error);
            setStep(prev => prev + 1);
        } finally {
            setIsSaving(false);
        }
    };

    const saveStep2Data = async () => {
        setIsSaving(true);
        try {
            const diasResDb = await fetch('http://127.0.0.1:8000/api/dias');
            const diasDbList = await diasResDb.json();

            // Eliminar días que fueron deseleccionados (manejando FK dependencies primero)
            const diasABorrar = diasDbList.filter(dbD => !wizardData.dias.some(d => d.nombre === dbD.nombre_dia));
            if (diasABorrar.length > 0) {
                const configResDb = await fetch('http://127.0.0.1:8000/api/grado-dia-config');
                const configDbList = await configResDb.json();
                const configABorrar = configDbList.filter(c => diasABorrar.some(d => d.id_dia === c.id_dia));
                for (const c of configABorrar) {
                    await fetch(`http://127.0.0.1:8000/api/grado-dia-config/${c.id_config}`, { method: 'DELETE' });
                }

                const stResDb = await fetch('http://127.0.0.1:8000/api/seccion-turno');
                const stDbList = await stResDb.json();
                const stABorrar = stDbList.filter(st => diasABorrar.some(d => d.id_dia === st.id_dia));
                for (const st of stABorrar) {
                    await fetch(`http://127.0.0.1:8000/api/seccion-turno/${st.id_seccion_turno}`, { method: 'DELETE' });
                }

                for (const dbD of diasABorrar) {
                    await fetch(`http://127.0.0.1:8000/api/dias/${dbD.id_dia}`, { method: 'DELETE' });
                }
            }

            // Ordenar días por su ID (orden lógico) antes de guardar
            const sortedDias = [...wizardData.dias].sort((a, b) => a.id - b.id);
            for (const d of sortedDias) {
                if (!diasDbList.some(dbD => dbD.nombre_dia === d.nombre)) {
                    await fetch('http://127.0.0.1:8000/api/dias', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre_dia: d.nombre, orden: d.id })
                    });
                }
            }

            const gradosResDb = await fetch('http://127.0.0.1:8000/api/grados');
            const gradosDbList = await gradosResDb.json();

            // Eliminar grados deseleccionados (manejando FK dependencies)
            const gradosABorrar = gradosDbList.filter(dbG => !wizardData.grados.includes(dbG.numero));
            if (gradosABorrar.length > 0) {
                const configResDb = await fetch('http://127.0.0.1:8000/api/grado-dia-config');
                const configDbList = await configResDb.json();
                const configABorrar = configDbList.filter(c => gradosABorrar.some(g => g.id_grado === c.id_grado));
                for (const c of configABorrar) {
                    await fetch(`http://127.0.0.1:8000/api/grado-dia-config/${c.id_config}`, { method: 'DELETE' });
                }

                const secResDb = await fetch('http://127.0.0.1:8000/api/secciones');
                const secDbList = await secResDb.json();
                const secABorrar = secDbList.filter(s => gradosABorrar.some(g => g.id_grado === s.id_grado));

                if (secABorrar.length > 0) {
                    const stResDb = await fetch('http://127.0.0.1:8000/api/seccion-turno');
                    const stDbList = await stResDb.json();
                    const stABorrar = stDbList.filter(st => secABorrar.some(s => s.id_seccion === st.id_seccion));
                    for (const st of stABorrar) {
                        await fetch(`http://127.0.0.1:8000/api/seccion-turno/${st.id_seccion_turno}`, { method: 'DELETE' });
                    }

                    for (const s of secABorrar) {
                        await fetch(`http://127.0.0.1:8000/api/secciones/${s.id_seccion}`, { method: 'DELETE' });
                    }
                }

                for (const dbG of gradosABorrar) {
                    await fetch(`http://127.0.0.1:8000/api/grados/${dbG.id_grado}`, { method: 'DELETE' });
                }
            }

            // Ordenar grados de menor a mayor antes de guardar (secuencial para preservar IDs lógicos)
            const sortedGrados = [...wizardData.grados].sort((a, b) => a - b);
            for (const g of sortedGrados) {
                if (!gradosDbList.some(dbG => dbG.numero === g)) {
                    await fetch('http://127.0.0.1:8000/api/grados', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ numero: g })
                    });
                }
            }

            setSavedSteps(prev => prev.includes(2) ? prev : [...prev, 2]);
            setEditingSteps(prev => prev.filter(s => s !== 2));
            setStep(prev => prev + 1);
        } catch (error) {
            console.error("Error al guardar días y grados:", error);
            showError("Hubo un error guardando los datos del paso 2.");
            setStep(prev => prev + 1);
        } finally {
            setIsSaving(false);
        }
    };

    const saveStep3Data = async () => {
        setIsSaving(true);
        try {
            // Obtener los IDs reales de la base de datos
            const gradosRes = await fetch('http://127.0.0.1:8000/api/grados');
            const gradosDb = await gradosRes.json();

            const diasRes = await fetch('http://127.0.0.1:8000/api/dias');
            const diasDb = await diasRes.json();

            const configRes = await fetch('http://127.0.0.1:8000/api/grado-dia-config');
            const configDb = await configRes.json();

            const { gradoDiaConfig } = wizardData;

            // Verificamos si config existe y tiene datos
            if (!gradoDiaConfig || Object.keys(gradoDiaConfig).length === 0) {
                console.warn("No hay configuración de bloques para guardar.");
            } else {
                // Ordenamos las llaves por grado y luego por día para mantener el orden en la base de datos
                const sortedKeys = Object.keys(gradoDiaConfig).sort((a, b) => {
                    const [gA, dA] = a.split('-').map(Number);
                    const [gB, dB] = b.split('-').map(Number);
                    if (gA !== gB) return gA - gB;
                    return dA - dB;
                });

                for (const key of sortedKeys) {
                    const bloques = parseInt(gradoDiaConfig[key]);
                    const [gradoNumStr, diaIdStr] = key.split('-');
                    const gradoNum = parseInt(gradoNumStr);
                    const diaIdLocal = parseInt(diaIdStr);

                    // Buscar el ID real
                    const realGrado = gradosDb.find(g => g.numero === gradoNum);
                    const realDia = diasDb.find(d => d.orden === diaIdLocal);

                    if (realGrado && realDia) {
                        const existing = configDb.find(c => c.id_grado === realGrado.id_grado && c.id_dia === realDia.id_dia);

                        if (existing) {
                            if (bloques === 0) {
                                // Borrar si se puso en 0
                                await fetch(`http://127.0.0.1:8000/api/grado-dia-config/${existing.id_config}`, { method: 'DELETE' });
                            } else if (existing.bloques_dia !== bloques) {
                                // Actualizar si cambió usando el nuevo endpoint PUT
                                const putRes = await fetch(`http://127.0.0.1:8000/api/grado-dia-config/${existing.id_config}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        id_grado: realGrado.id_grado,
                                        id_dia: realDia.id_dia,
                                        bloques_dia: bloques
                                    })
                                });
                                if (!putRes.ok) throw new Error(await putRes.text());
                            }
                        } else if (bloques > 0) {
                            // Crear nuevo de manera secuencial para preservar el orden
                            const response = await fetch('http://127.0.0.1:8000/api/grado-dia-config', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    id_grado: realGrado.id_grado,
                                    id_dia: realDia.id_dia,
                                    bloques_dia: bloques
                                })
                            });
                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Error backend: ${errorText}`);
                            }
                        }
                    } else {
                        console.warn(`No se encontraron IDs reales para Grado ${gradoNum} y Día ${diaIdLocal}`);
                    }
                }
            }

            setSavedSteps(prev => prev.includes(3) ? prev : [...prev, 3]);
            setEditingSteps(prev => prev.filter(s => s !== 3));
            setStep(prev => prev + 1);
        } catch (error) {
            console.error("Error al guardar configuración de bloques:", error);
            showError("Hubo un error guardando los datos del paso 3. Revisa la consola.");
            setStep(prev => prev + 1);
        } finally {
            setIsSaving(false);
        }
    };

    const saveStep4Data = async () => {
        setIsSaving(true);
        try {
            const sedesRes = await fetch('http://127.0.0.1:8000/api/sedes');
            const sedesDb = await sedesRes.json();

            const gradosRes = await fetch('http://127.0.0.1:8000/api/grados');
            const gradosDb = await gradosRes.json();

            const seccionesRes = await fetch('http://127.0.0.1:8000/api/secciones');
            const seccionesDb = await seccionesRes.json();

            const { secciones } = wizardData;

            if (!secciones || Object.keys(secciones).length === 0) {
                console.warn("No hay configuración de secciones para guardar.");
            } else {
                // Generar lista plana para ordenar
                let seccionesAInsertar = [];
                for (const [sedeNombre, gradosObj] of Object.entries(secciones)) {
                    const realSede = sedesDb.find(s => s.nombre_sede === sedeNombre);
                    if (!realSede) continue;

                    for (const [gradoNumStr, secList] of Object.entries(gradosObj)) {
                        const gradoNum = parseInt(gradoNumStr);
                        const realGrado = gradosDb.find(g => g.numero === gradoNum);
                        if (!realGrado) continue;

                        for (const secNombre of secList) {
                            seccionesAInsertar.push({
                                id_sede: realSede.id_sede,
                                id_grado: realGrado.id_grado,
                                nombre: secNombre,
                                // Guardamos para ordenar
                                sedeOrd: realSede.id_sede,
                                gradoOrd: realGrado.numero
                            });
                        }
                    }
                }

                // Ordenar por sede, luego grado, luego alfabéticamente por sección
                seccionesAInsertar.sort((a, b) => {
                    if (a.sedeOrd !== b.sedeOrd) return a.sedeOrd - b.sedeOrd;
                    if (a.gradoOrd !== b.gradoOrd) return a.gradoOrd - b.gradoOrd;
                    return a.nombre.localeCompare(b.nombre);
                });

                // Borrar secciones que ya no están (para edición limpia - manejando FK)
                const seccionesABorrar = seccionesDb
                    .filter(dbS => !seccionesAInsertar.some(s => s.id_sede === dbS.id_sede && s.id_grado === dbS.id_grado && s.nombre === dbS.nombre));

                if (seccionesABorrar.length > 0) {
                    // Primero borrar de seccion-turno
                    const stResDb = await fetch('http://127.0.0.1:8000/api/seccion-turno');
                    const stDbList = await stResDb.json();
                    const stABorrar = stDbList.filter(st => seccionesABorrar.some(s => s.id_seccion === st.id_seccion));
                    for (const st of stABorrar) {
                        await fetch(`http://127.0.0.1:8000/api/seccion-turno/${st.id_seccion_turno}`, { method: 'DELETE' });
                    }

                    // Luego borrar las secciones
                    for (const dbS of seccionesABorrar) {
                        await fetch(`http://127.0.0.1:8000/api/secciones/${dbS.id_seccion}`, { method: 'DELETE' });
                    }
                }

                // Insertar nuevas secuencialmente para mantener orden de IDs
                for (const sec of seccionesAInsertar) {
                    if (!seccionesDb.some(dbS => dbS.id_sede === sec.id_sede && dbS.id_grado === sec.id_grado && dbS.nombre === sec.nombre)) {
                        await fetch('http://127.0.0.1:8000/api/secciones', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id_sede: sec.id_sede,
                                id_grado: sec.id_grado,
                                nombre: sec.nombre
                            })
                        });
                    }
                }
            }

            if (totalSteps === 6) {
                setSavedSteps(prev => prev.includes(4) ? prev : [...prev, 4]);
                setEditingSteps(prev => prev.filter(s => s !== 4));
                setStep(5);
            } else {
                await autoAssignTurnoUnico();
                setSavedSteps(prev => prev.includes(4) ? prev : [...prev, 4]);
                setEditingSteps(prev => prev.filter(s => s !== 4));
                setStep(5);
            }
        } catch (error) {
            console.error("Error al guardar configuración de secciones:", error);
            showError("Hubo un error guardando los datos del paso 4. Revisa la consola.");
        } finally {
            setIsSaving(false);
        }
    };

    const autoAssignTurnoUnico = async () => {
        const seccionesRes = await fetch('http://127.0.0.1:8000/api/secciones');
        const seccionesDb = await seccionesRes.json();

        const turnosRes = await fetch('http://127.0.0.1:8000/api/turnos');
        const turnosDb = await turnosRes.json();

        const diasRes = await fetch('http://127.0.0.1:8000/api/dias');
        const diasDb = await diasRes.json();

        if (turnosDb.length === 0) return;
        const turnoId = turnosDb[0].id_turno;

        const stRes = await fetch('http://127.0.0.1:8000/api/seccion-turno');
        const stDb = await stRes.json();

        const requiredRelations = [];
        for (const sec of seccionesDb) {
            for (const dia of diasDb) {
                requiredRelations.push({ id_seccion: sec.id_seccion, id_turno: turnoId, id_dia: dia.id_dia });
            }
        }

        const toInsert = requiredRelations.filter(r => !stDb.some(dbSt => dbSt.id_seccion === r.id_seccion && dbSt.id_turno === r.id_turno && dbSt.id_dia === r.id_dia));
        for (const r of toInsert) {
            await fetch('http://127.0.0.1:8000/api/seccion-turno', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(r)
            });
        }
    };

    const saveStep5Data = async () => {
        setIsSaving(true);
        try {
            const seccionesRes = await fetch('http://127.0.0.1:8000/api/secciones');
            const seccionesDb = await seccionesRes.json();

            const turnosRes = await fetch('http://127.0.0.1:8000/api/turnos');
            const turnosDb = await turnosRes.json();

            const diasRes = await fetch('http://127.0.0.1:8000/api/dias');
            const diasDb = await diasRes.json();

            const sedesRes = await fetch('http://127.0.0.1:8000/api/sedes');
            const sedesDb = await sedesRes.json();

            const gradosRes = await fetch('http://127.0.0.1:8000/api/grados');
            const gradosDb = await gradosRes.json();

            const { seccionTurno } = wizardData;

            if (seccionTurno) {
                const requiredRelations = [];
                for (const [sedeNombre, gradosObj] of Object.entries(seccionTurno)) {
                    const realSede = sedesDb.find(s => s.nombre_sede === sedeNombre);
                    if (!realSede) continue;

                    for (const [gradoNumStr, seccionesObj] of Object.entries(gradosObj)) {
                        const gradoNum = parseInt(gradoNumStr);
                        const realGrado = gradosDb.find(g => g.numero === gradoNum);
                        if (!realGrado) continue;

                        for (const [seccionNombre, turnoValor] of Object.entries(seccionesObj)) {
                            const realSeccion = seccionesDb.find(s =>
                                s.id_sede === realSede.id_sede &&
                                s.id_grado === realGrado.id_grado &&
                                s.nombre === seccionNombre
                            );
                            if (!realSeccion) continue;

                            if (typeof turnoValor === 'string') {
                                const realTurno = turnosDb.find(t => t.nombre === turnoValor);
                                if (realTurno) {
                                    for (const dia of diasDb) {
                                        requiredRelations.push({ id_seccion: realSeccion.id_seccion, id_turno: realTurno.id_turno, id_dia: dia.id_dia });
                                    }
                                }
                            } else if (typeof turnoValor === 'object' && turnoValor !== null) {
                                for (const [diaIdLocal, turnoNombre] of Object.entries(turnoValor)) {
                                    const realDia = diasDb.find(d => d.orden === parseInt(diaIdLocal));
                                    const realTurno = turnosDb.find(t => t.nombre === turnoNombre);
                                    if (realDia && realTurno) {
                                        requiredRelations.push({ id_seccion: realSeccion.id_seccion, id_turno: realTurno.id_turno, id_dia: realDia.id_dia });
                                    }
                                }
                            }
                        }
                    }
                }

                const stRes = await fetch('http://127.0.0.1:8000/api/seccion-turno');
                const stDb = await stRes.json();

                // Borrar relaciones que ya no existen (Edición)
                const toDelete = stDb.filter(dbSt => !requiredRelations.some(r => r.id_seccion === dbSt.id_seccion && r.id_turno === dbSt.id_turno && r.id_dia === dbSt.id_dia));
                for (const dbSt of toDelete) {
                    await fetch(`http://127.0.0.1:8000/api/seccion-turno/${dbSt.id_seccion_turno}`, { method: 'DELETE' });
                }

                // Insertar nuevas
                const toInsert = requiredRelations.filter(r => !stDb.some(dbSt => dbSt.id_seccion === r.id_seccion && dbSt.id_turno === r.id_turno && dbSt.id_dia === r.id_dia));
                for (const r of toInsert) {
                    await fetch('http://127.0.0.1:8000/api/seccion-turno', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(r)
                    });
                }
            }

            setSavedSteps(prev => prev.includes(5) ? prev : [...prev, 5]);
            setEditingSteps(prev => prev.filter(s => s !== 5));
            setStep(6);
        } catch (error) {
            console.error("Error al guardar configuración de turnos:", error);
            showError("Hubo un error guardando los datos del paso 5.");
        } finally {
            setIsSaving(false);
        }
    };

    const saveStep6Data = async () => {
        setIsSaving(true);
        try {
            const { tutoria } = wizardData;
            
            if (tutoria === 'oficial' || tutoria === 'normal') {
                const nombreDelCurso = tutoria === 'oficial' ? 'Tutoría' : 'Tutoría Psicológica';
                
                // 1. Buscar o crear área "Desarrollo Personal"
                const areasRes = await fetch('http://127.0.0.1:8000/api/areas');
                const areas = await areasRes.json();
                
                let areaId = null;
                const areaExistente = areas.find(a =>
                    (a.nombre_area || a.nombre) === "Desarrollo Personal" || (a.nombre_area || a.nombre) === "Tutoría"
                );
    
                if (areaExistente) {
                    areaId = areaExistente.id_area || areaExistente.id;
                } else {
                    const resArea = await fetch('http://127.0.0.1:8000/api/areas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: "Desarrollo Personal", max_horas_dia: 2 })
                    });
                    if (resArea.ok) {
                        const newArea = await resArea.json();
                        areaId = newArea.id_area || newArea.id;
                    }
                }
                
                // 2. Crear curso de tutoría si no existe
                if (areaId) {
                    const cursosRes = await fetch('http://127.0.0.1:8000/api/cursos');
                    const cursos = await cursosRes.json();
                    
                    const cursoExiste = cursos.find(c => c.nombre_curso === nombreDelCurso);
                    if (!cursoExiste) {
                        await fetch('http://127.0.0.1:8000/api/cursos', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                nombre_curso: nombreDelCurso,
                                id_area: areaId,
                                requiere_espacio_unico: false
                            })
                        });
                    }
                }
            }
            
            // Mark Tutoria configured
            localStorage.setItem('edusync_tutoria_configured', 'true');
            
            setSavedSteps(prev => prev.includes(totalSteps - 1) ? prev : [...prev, totalSteps - 1]);
            setEditingSteps(prev => prev.filter(s => s !== (totalSteps - 1)));
            
            // Avanzar al paso final (Resumen)
            setStep(totalSteps);
        } catch (error) {
            console.error("Error al guardar tutoría:", error);
            showError("Hubo un error guardando la tutoría.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            setErrorMsg('');
            setFieldErrors({});
            const { colegio, tipo_sede, sedes, turnos } = wizardData;

            let errors = {};
            if (!colegio.nombre.trim()) errors.colegio = 'Por favor, ingresa el nombre de la institución.';
            if (tipo_sede === null) errors.tipo_sede = 'Por favor, selecciona el tipo de sede.';
            else if (!sedes || sedes.length === 0 || sedes.some(s => !s.trim())) errors.sedes = tipo_sede === false ? 'Por favor, ingresa el nombre de la sede.' : 'Por favor, ingresa el nombre de todas las sedes.';
            if (turnos.length === 0) errors.turnos = 'Por favor, selecciona al menos un horario de operación.';

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return;
            }

            // Si el paso 1 ya fue guardado y NO se está editando, solo avanzar sin volver a guardar
            if (savedSteps.includes(1) && !editingSteps.includes(1)) {
                setStep(prev => prev + 1);
            } else {
                saveStep1Data();
            }
        } else if (step === 2) {
            setErrorMsg('');
            const { dias, grados } = wizardData;

            if (!dias || dias.length === 0 || !grados || grados.length === 0) {
                showError('Por favor, selecciona al menos un día y un grado.');
                return;
            }

            // Si el paso 2 ya fue guardado, solo avanzar sin volver a guardar
            if (savedSteps.includes(2) && !editingSteps.includes(2)) {
                setStep(prev => prev + 1);
            } else {
                saveStep2Data();
            }
        } else if (step === 3) {
            setErrorMsg('');

            // Validación: Asegurar que todos los grados tengan al menos un bloque asignado
            const { gradoDiaConfig, grados } = wizardData;
            if (!gradoDiaConfig || Object.keys(gradoDiaConfig).length === 0) {
                showError('Configuración inválida. Por favor, asigna los bloques por día.');
                return;
            }

            let gradosSinBloques = [];
            for (let g of grados) {
                let totalBloquesGrado = 0;
                for (const [key, bloques] of Object.entries(gradoDiaConfig)) {
                    if (key.startsWith(`${g}-`)) {
                        totalBloquesGrado += bloques;
                    }
                }
                if (totalBloquesGrado === 0) {
                    gradosSinBloques.push(g);
                }
            }

            if (gradosSinBloques.length > 0) {
                const mensaje = gradosSinBloques.length === 1
                    ? `El grado ${gradosSinBloques[0]}° no tiene ningún bloque asignado.`
                    : `Los grados ${gradosSinBloques.join(', ')}° no tienen bloques asignados.`;
                showError(`${mensaje} Asigna al menos un bloque en algún día de la semana.`);
                return;
            }

            if (savedSteps.includes(3) && !editingSteps.includes(3)) {
                setStep(prev => prev + 1);
            } else {
                saveStep3Data();
            }
        } else if (step === 4) {
            setErrorMsg('');

            // Validación: Asegurar que todos los grados en todas las sedes tengan al menos 1 sección
            const { secciones, grados, sedes } = wizardData;
            if (!secciones) {
                showError('Configuración inválida. Por favor, añade las secciones.');
                return;
            }

            let gradosSinSeccion = [];
            for (let sede of sedes) {
                for (let g of grados) {
                    const secList = secciones[sede]?.[g] || [];
                    if (secList.length === 0) {
                        gradosSinSeccion.push(`${g}° (Sede ${sede})`);
                    }
                }
            }

            if (gradosSinSeccion.length > 0) {
                showError(`Faltan secciones en: ${gradosSinSeccion.join(', ')}. Añade al menos una sección.`);
                return;
            }

            if (savedSteps.includes(4) && !editingSteps.includes(4)) {
                setStep(5);
            } else {
                saveStep4Data();
            }
        } else if (step === 5 && totalSteps === 7) {
            setErrorMsg('');

            const { seccionTurno, secciones } = wizardData;
            let missingShifts = false;

            if (!seccionTurno) {
                missingShifts = true;
            } else {
                for (const sede of Object.keys(secciones || {})) {
                    for (const grado of Object.keys(secciones[sede] || {})) {
                        for (const sec of (secciones[sede][grado] || [])) {
                            const val = seccionTurno[sede]?.[grado]?.[sec];
                            if (val === null || val === undefined || val === '') {
                                missingShifts = true;
                                break;
                            } else if (typeof val === 'object') {
                                if (Object.values(val).some(v => v === null || v === undefined || v === '')) {
                                    missingShifts = true;
                                    break;
                                }
                            }
                        }
                        if (missingShifts) break;
                    }
                    if (missingShifts) break;
                }
            }

            if (missingShifts) {
                showError("Falta asignar turnos. Por favor, selecciona un turno (Mañana o Tarde) para todas las secciones.");
                return;
            }

            if (savedSteps.includes(5) && !editingSteps.includes(5)) {
                setStep(6);
            } else {
                saveStep5Data();
            }
        } else if (step === 5 && totalSteps === 6) {
            // Un solo turno, el paso 5 es Tutoria (porque saltamos el paso de asignación)
            saveStep6Data();
        } else if (step === 6 && totalSteps === 7) {
            // El paso 6 es Tutoria si hay multiples turnos
            saveStep6Data();
        } else if (step === totalSteps) {
            // Pantalla final de resumen
            if (typeof window !== 'undefined') {
                setTimeout(() => {
                    sessionStorage.removeItem('edusync_wizard_step');
                    sessionStorage.removeItem('edusync_wizard_data');
                    sessionStorage.removeItem('edusync_wizard_saved_steps');
                    sessionStorage.setItem('edusync_first_login', 'true');
                    window.location.href = '/dashboard';
                }, 400);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    // --- TIMELINE HELPERS ---
    const nodes = Array.from({length: totalSteps}).map((_, i) => {
        const x = [50, 75, 25, 75, 25, 50][i];
        const y = (i + 1) * (100 / (totalSteps + 1));
        return { x, y, stepNum: i + 1 };
    });

    const generatePath = () => {
        if (nodes.length === 0) return "";
        let path = `M ${nodes[0].x} ${nodes[0].y}`;
        for (let i = 1; i < nodes.length; i++) {
            const prev = nodes[i-1];
            const curr = nodes[i];
            const cp1y = prev.y + (curr.y - prev.y) / 2;
            path += ` C ${prev.x} ${cp1y}, ${curr.x} ${cp1y}, ${curr.x} ${curr.y}`;
        }
        return path;
    };

    const generateActivePath = () => {
        if (nodes.length === 0 || step <= 1) return "";
        let path = `M ${nodes[0].x} ${nodes[0].y}`;
        const limit = Math.min(step, totalSteps);
        const activeNodes = nodes.slice(0, limit); 
        for (let i = 1; i < activeNodes.length; i++) {
            const prev = activeNodes[i-1];
            const curr = activeNodes[i];
            const cp1y = prev.y + (curr.y - prev.y) / 2;
            path += ` C ${prev.x} ${cp1y}, ${curr.x} ${cp1y}, ${curr.x} ${curr.y}`;
        }
        return path;
    };

    return (
        <div
            className="flex font-sans text-slate-800 overflow-hidden w-screen h-screen bg-[var(--color-brand-light)]"
            style={{
                opacity: mounted ? 1 : 0,
                visibility: mounted ? 'visible' : 'hidden',
                transition: mounted ? 'opacity 0.35s ease' : 'none',
            }}
        >
            {/* ===== LEFT PANEL: MAP TIMELINE ===== */}
            <div className="hidden lg:block w-[30%] max-w-[350px] h-full relative border-r border-[var(--color-brand-white)]/50 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden">
                {/* Branding Top Left */}
                <div className="absolute top-8 left-8 flex items-center gap-2 z-50">
                    <span className="text-[22px] font-black tracking-wide text-[var(--color-brand-dark)] drop-shadow-sm">HoraVlep</span>
                </div>

                <div className="absolute inset-0 top-24 bottom-12 pointer-events-none">
                    {/* SVG PATHS */}
                    <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Background Path */}
                        <path d={generatePath()} fill="none" stroke="var(--color-brand-dark)" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="2 3" strokeLinecap="round" />
                        {/* Active Path */}
                        <path d={generateActivePath()} fill="none" stroke="var(--color-brand-dark)" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" className="transition-all duration-700 ease-out drop-shadow-sm" />
                    </svg>

                    {/* Nodes */}
                    {nodes.map((node) => {
                        const stepNum = node.stepNum;
                        const isActive = step === stepNum;
                        const isCompleted = step > stepNum;
                        
                        let stepName = "";
                        if (stepNum === 1) stepName = "Institución";
                        else if (stepNum === 2) stepName = "Días / Grados";
                        else if (stepNum === 3) stepName = "Bloques";
                        else if (stepNum === 4) stepName = "Secciones";
                        else if (stepNum === 5 && totalSteps === 7) stepName = "Turnos";
                        else if (stepNum === totalSteps - 1) stepName = "Tutoría";
                        else if (stepNum === totalSteps) stepName = "Finalizado";

                        return (
                            <div 
                                key={stepNum} 
                                className="absolute flex flex-col items-center pointer-events-auto"
                                style={{ 
                                    left: `${node.x}%`, 
                                    top: `${node.y}%`, 
                                    transform: 'translate(-50%, -50%)',
                                    transition: 'all 0.5s ease'
                                }}
                            >
                                <div 
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[15px] transition-all duration-500 shadow-xl border-4 ${
                                        isActive 
                                            ? "bg-[var(--color-brand-dark)] text-[var(--color-brand-white)] scale-110 shadow-[var(--color-brand-dark)]/40 border-[var(--color-brand-white)]" 
                                            : isCompleted 
                                                ? "bg-[var(--color-brand-dark)] text-[var(--color-brand-white)] border-[var(--color-brand-white)]" 
                                                : "bg-[var(--color-brand-white)] text-[var(--color-brand-dark)] border-[var(--color-brand-light)]"
                                    }`}
                                >
                                    {isCompleted ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ) : (
                                        stepNum
                                    )}
                                </div>
                                <span 
                                    className={`absolute top-full mt-2 px-3 py-1.5 rounded-xl text-[12px] font-extrabold text-center tracking-widest uppercase transition-colors whitespace-nowrap shadow-sm ${
                                        isActive ? 'bg-white text-[var(--color-brand-dark)] scale-105' : isCompleted ? 'bg-white/90 text-[var(--color-brand-dark)]/80' : 'bg-white/70 text-[var(--color-brand-dark)]/60'
                                    }`}
                                >
                                    {stepName}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ===== RIGHT PANEL: CONTENT ===== */}
            <div
                className="flex-1 relative z-0 overflow-y-auto w-full flex flex-col bg-[var(--color-brand-white)]"
                style={{
                    transform: entered ? 'translateY(0)' : 'translateY(20px)',
                    opacity: entered ? 1 : 0,
                    transition: 'all 0.7s ease-in-out',
                }}
            >
                {/* Top Right Profile/Logout */}
                <div className="absolute top-6 right-8 flex items-center gap-2 z-50">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center text-[var(--color-brand-primary)] font-bold cursor-pointer hover:bg-[var(--color-brand-primary)]/20 transition-colors" title="Perfil">
                        A
                    </div>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Cerrar Sesión"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                </div>

                <div className="min-h-full w-full flex flex-col items-center py-16 px-4 lg:px-12">
                    <div className="w-full max-w-4xl flex-grow flex flex-col">
                        
                        {/* Header Mobile / Title */}
                        <div className="lg:hidden w-full flex flex-col items-center justify-center mb-8">
                            <span className="text-[20px] font-black tracking-wide text-[var(--color-brand-dark)] mb-2">HoraVlep</span>
                            <div className="text-[11px] font-bold tracking-widest text-[var(--color-brand-primary)] uppercase">
                                Paso {step} de {totalSteps}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="w-full relative flex-grow flex flex-col">
                            {step === 1 && (
                                <Paso1Institucion
                                    data={wizardData}
                                    setData={setWizardData}
                                    errors={fieldErrors}
                                    clearError={(field) => setFieldErrors(prev => ({ ...prev, [field]: null }))}
                                    isSaved={savedSteps.includes(1) && !editingSteps.includes(1)}
                                    onEnableEdit={() => {
                                        setWizardDataBackup(JSON.parse(JSON.stringify(wizardData)));
                                        setEditingSteps(prev => [...prev, 1]);
                                    }}
                                    isEditing={editingSteps.includes(1)}
                                    onCancelEdit={() => {
                                        if (wizardDataBackup) {
                                            setWizardData(wizardDataBackup);
                                        }
                                        setEditingSteps(prev => prev.filter(s => s !== 1));
                                    }}
                                />
                            )}
                            {step === 2 && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso2DiasGrados
                                        data={wizardData}
                                        setData={setWizardData}
                                        isSaved={savedSteps.includes(2) && !editingSteps.includes(2)}
                                        onEnableEdit={() => {
                                            setWizardDataBackup(JSON.parse(JSON.stringify(wizardData)));
                                            setEditingSteps(prev => [...prev, 2]);
                                        }}
                                        isEditing={editingSteps.includes(2)}
                                        onCancelEdit={() => {
                                            if (wizardDataBackup) {
                                                setWizardData(wizardDataBackup);
                                            }
                                            setEditingSteps(prev => prev.filter(s => s !== 2));
                                        }}
                                    />
                                </div>
                            )}
                            {step === 3 && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso3GradoDiaConfig
                                        data={wizardData}
                                        setData={setWizardData}
                                        isSaved={savedSteps.includes(3) && !editingSteps.includes(3)}
                                        onEnableEdit={() => {
                                            setWizardDataBackup(JSON.parse(JSON.stringify(wizardData)));
                                            setEditingSteps(prev => [...prev, 3]);
                                        }}
                                        isEditing={editingSteps.includes(3)}
                                        onCancelEdit={() => {
                                            if (wizardDataBackup) {
                                                setWizardData(wizardDataBackup);
                                            }
                                            setEditingSteps(prev => prev.filter(s => s !== 3));
                                        }}
                                    />
                                </div>
                            )}
                            {step === 4 && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso4Secciones
                                        data={wizardData}
                                        setData={setWizardData}
                                        isSaved={savedSteps.includes(4) && !editingSteps.includes(4)}
                                        onEnableEdit={() => {
                                            setWizardDataBackup(JSON.parse(JSON.stringify(wizardData)));
                                            setEditingSteps(prev => [...prev, 4]);
                                        }}
                                        isEditing={editingSteps.includes(4)}
                                        onCancelEdit={() => {
                                            if (wizardDataBackup) {
                                                setWizardData(wizardDataBackup);
                                            }
                                            setEditingSteps(prev => prev.filter(s => s !== 4));
                                        }}
                                    />
                                </div>
                            )}
                            {step === 5 && totalSteps === 7 && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso5Turnos
                                        data={wizardData}
                                        setData={setWizardData}
                                        isSaved={savedSteps.includes(5) && !editingSteps.includes(5)}
                                        onEnableEdit={() => {
                                            setWizardDataBackup(JSON.parse(JSON.stringify(wizardData)));
                                            setEditingSteps(prev => [...prev, 5]);
                                        }}
                                        isEditing={editingSteps.includes(5)}
                                        onCancelEdit={() => {
                                            if (wizardDataBackup) {
                                                setWizardData(wizardDataBackup);
                                            }
                                            setEditingSteps(prev => prev.filter(s => s !== 5));
                                        }}
                                    />
                                </div>
                            )}
                            {step === (totalSteps - 1) && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso6Tutoria
                                        data={wizardData}
                                        setData={setWizardData}
                                        isSaved={savedSteps.includes(totalSteps - 1) && !editingSteps.includes(totalSteps - 1)}
                                        onEnableEdit={() => {
                                            setWizardDataBackup(JSON.parse(JSON.stringify(wizardData)));
                                            setEditingSteps(prev => [...prev, totalSteps - 1]);
                                        }}
                                        isEditing={editingSteps.includes(totalSteps - 1)}
                                        onCancelEdit={() => {
                                            if (wizardDataBackup) {
                                                setWizardData(wizardDataBackup);
                                            }
                                            setEditingSteps(prev => prev.filter(s => s !== (totalSteps - 1)));
                                        }}
                                    />
                                </div>
                            )}
                            {step === totalSteps && (() => {
                                // Calculamos un pequeño resumen real para no hacerlo tan seco
                                const totalSedes = wizardData.sedes?.length || 0;
                                const totalGrados = wizardData.grados?.length || 0;
                                let totalSecciones = 0;
                                if (wizardData.secciones) {
                                    Object.values(wizardData.secciones).forEach(grados => {
                                        Object.values(grados).forEach(secList => {
                                            totalSecciones += secList.length;
                                        });
                                    });
                                }

                                return (
                                    <div className="flex flex-col items-center justify-center flex-grow animate-fade-in px-4 w-full" style={{ animationDuration: '0.6s' }}>
                                        
                                        <div className="w-20 h-20 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] rounded-full flex items-center justify-center mb-6">
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                            </svg>
                                        </div>

                                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2 text-center">
                                            ¡Todo listo!
                                        </h2>
                                        
                                        <p className="text-slate-500 text-center text-[15px] leading-relaxed mb-10 max-w-lg">
                                            El colegio <strong className="text-slate-700 font-bold">{wizardData.colegio.nombre}</strong> ha sido configurado exitosamente. Se ha guardado la siguiente estructura:
                                        </p>

                                        {/* Resumen dinámico real "suelto" sin contenedor */}
                                        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 w-full">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-4xl sm:text-5xl font-black text-[var(--color-brand-primary)]">{totalSedes}</span>
                                                <span className="text-[11px] sm:text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-2">Sedes</span>
                                            </div>
                                            
                                            <div className="hidden sm:block w-[2px] h-12 bg-slate-100"></div>
                                            
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-4xl sm:text-5xl font-black text-[var(--color-brand-primary)]">{totalGrados}</span>
                                                <span className="text-[11px] sm:text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-2">Grados</span>
                                            </div>
                                            
                                            <div className="hidden sm:block w-[2px] h-12 bg-slate-100"></div>
                                            
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-4xl sm:text-5xl font-black text-[var(--color-brand-primary)]">{totalSecciones}</span>
                                                <span className="text-[11px] sm:text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-2">Secciones</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Mensaje de Error Integrado muy cerca del formulario */}
                            {errorMsg && (
                                <div className="mt-6 mx-auto w-fit max-w-[500px] px-5 py-3 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center gap-2 animate-fade-in text-red-600 text-xs font-black uppercase tracking-widest shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    {errorMsg}
                                </div>
                            )}

                            {/* Botones de navegación */}
                            <div className="mt-auto pt-10 w-full flex flex-col items-center">
                                <div className="flex justify-center gap-4 w-full">
                                    {step > 1 && (
                                        <button
                                            onClick={handleBack}
                                            className="cursor-pointer w-[220px] sm:w-[260px] py-4 rounded-xl font-bold text-[13px] tracking-widest transition-all border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10"
                                        >
                                            VOLVER
                                        </button>
                                    )}
                                    <button
                                        onClick={handleNext}
                                        disabled={isSaving}
                                        className={`cursor-pointer w-[220px] sm:w-[260px] py-4 rounded-xl font-bold text-[13px] tracking-widest text-[var(--color-brand-white)] transition-all duration-300 ${isSaving ? 'bg-[var(--color-brand-primary)]/50 cursor-not-allowed' : 'bg-[var(--color-brand-primary)] hover:scale-[1.01] shadow-[0_8px_20px_-6px_var(--color-brand-primary)]'}`}
                                    >
                                        {isSaving ? 'GUARDANDO...' : (step === totalSteps ? 'IR AL DASHBOARD' : 'CONTINUAR Y GUARDAR')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
