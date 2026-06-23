import React, { useState, useEffect, useRef } from 'react';
import Paso1Institucion from './Steps/Paso1Institucion';
import Paso2DiasGrados from './Steps/Paso2DiasGrados';
import Paso3GradoDiaConfig from './Steps/Paso3GradoDiaConfig';
import Paso4Secciones from './Steps/Paso4Secciones';
import Paso5Turnos from './Steps/Paso5Turnos';

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
    seccionTurno: null
};



function getSavedStep() {
    if (typeof window === 'undefined') return 1;
    try {
        const s = sessionStorage.getItem('horarix_wizard_step');
        return s ? parseInt(s, 10) : 1;
    } catch { return 1; }
}

function getSavedData() {
    if (typeof window === 'undefined') return DEFAULT_DATA;
    try {
        const d = sessionStorage.getItem('horarix_wizard_data');
        return d ? JSON.parse(d) : DEFAULT_DATA;
    } catch { return DEFAULT_DATA; }
}

function getSavedSteps() {
    if (typeof window === 'undefined') return [];
    try {
        const s = sessionStorage.getItem('horarix_wizard_saved_steps');
        return s ? JSON.parse(s) : [];
    } catch { return []; }
}

export default function SetupWizard() {
    const [step, setStep] = useState(1);
    const [wizardData, setWizardData] = useState(DEFAULT_DATA);
    const [savedSteps, setSavedSteps] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false); // guardia para no sobreescribir localStorage en el primer render
    const [errorMsg, setErrorMsg] = useState('');
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
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }
    }, [step]);
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [entered, setEntered] = useState(false);
    const [editingSteps, setEditingSteps] = useState([]);
    const [wizardDataBackup, setWizardDataBackup] = useState(null);

    const totalSteps = wizardData.turnos && wizardData.turnos.length > 1 ? 6 : 5;

    // Cargar desde sessionStorage solo en el cliente (después de montar)
    useEffect(() => {
        // Limpiar claves viejas de localStorage (migración a sessionStorage)
        try {
            localStorage.removeItem('horarix_wizard_step');
            localStorage.removeItem('horarix_wizard_data');
            localStorage.removeItem('horarix_wizard_saved_steps');
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
                    sessionStorage.removeItem('horarix_wizard_step');
                    sessionStorage.removeItem('horarix_wizard_data');
                    sessionStorage.removeItem('horarix_wizard_saved_steps');
                    setStep(1);
                    setWizardData(DEFAULT_DATA);
                    setSavedSteps([]);
                    setDataLoaded(true);
                } else {
                    // Si el colegio existe en la BD pero no hay sesión guardada (e.g. cerró la pestaña),
                    // restauramos el progreso desde el backend para evitar crear duplicados.
                    const sStep = sessionStorage.getItem('horarix_wizard_step');
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
                                    // Si existe, el wizard está completo.
                                    window.location.href = '/dashboard';
                                    return;
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
            sessionStorage.setItem('horarix_wizard_step', step.toString());
            sessionStorage.setItem('horarix_wizard_data', JSON.stringify(wizardData));
            sessionStorage.setItem('horarix_wizard_saved_steps', JSON.stringify(savedSteps));
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

    const handleNext = () => {
        if (step === 1) {
            setErrorMsg('');
            const { colegio, tipo_sede, sedes, turnos } = wizardData;

            if (!colegio.nombre.trim() ||
                tipo_sede === null ||
                !sedes ||
                sedes.length === 0 ||
                sedes.some(s => !s.trim()) ||
                turnos.length === 0) {
                showError('Por favor, completa todos los campos obligatorios.');
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
        } else if (step === 5 && totalSteps === 6) {
            setErrorMsg('');

            saveStep5Data();
        } else if (step === totalSteps) {
            if (typeof window !== 'undefined') {
                setTimeout(() => {
                    sessionStorage.removeItem('horarix_wizard_step');
                    sessionStorage.removeItem('horarix_wizard_data');
                    sessionStorage.removeItem('horarix_wizard_saved_steps');
                    window.location.href = '/dashboard';
                }, 800);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <div
            className="flex font-sans text-slate-800 overflow-hidden"
            style={{
                width: '100vw',
                height: '100vh',
                background: '#f8fafc',
                opacity: mounted ? 1 : 0,
                visibility: mounted ? 'visible' : 'hidden',
                transition: mounted ? 'opacity 0.35s ease' : 'none',
            }}
        >
            {/* ===== LEFT PANEL ===== */}
            <div
                className="hidden lg:flex flex-col justify-between relative z-10"
                style={{
                    width: '35%',
                    flexShrink: 0,
                    background: 'var(--color-hx-purple)',
                    padding: '48px',
                    transform: entered ? 'translateX(0)' : 'translateX(-110%)',
                    transition: 'transform 0.7s ease-in-out, background 0.5s ease',
                }}
            >
                <div style={{
                    position: 'absolute', top: 0, right: -150,
                    height: '100%', width: 152,
                    overflow: 'hidden', pointerEvents: 'none',
                }}>
                    <svg viewBox="0 0 100 1000" preserveAspectRatio="none"
                        style={{
                            width: '100%', height: '100%', display: 'block',
                            fill: 'var(--color-hx-purple)',
                            transition: 'fill 0.5s ease'
                        }}>
                        <path d="M0,0 L0,1000 L20,1000 C150,750 -50,250 20,0 Z"></path>
                    </svg>
                </div>

                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 256, height: 256, background: '#790EEC', opacity: 0.2, borderRadius: '50%', filter: 'blur(60px)' }}></div>
                <div style={{ position: 'absolute', top: '40%', left: '-20%', width: 320, height: 320, background: '#790EEC', opacity: 0.2, borderRadius: '50%', filter: 'blur(60px)' }}></div>

                <div className="relative z-10 flex items-center gap-3 group cursor-default">
                    <div className="relative w-8 h-8 rounded-lg border-[2px] border-white/80 rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:rotate-180 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                        <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse"></div>
                    </div>
                    <span className="text-white text-[22px] font-black tracking-widest uppercase ml-3 opacity-90 drop-shadow-sm">HorariX</span>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center flex-grow mt-12">
                    {/* Espacio reservado para la imagen que agregará el usuario */}
                    <div className="w-full flex justify-center mb-10">
                        <img
                            src={`/office.svg`}
                            alt={`Ilustración del paso ${step}`}
                            className="w-64 h-64 object-contain hover:scale-105 transition-transform duration-700 drop-shadow-2xl"
                            onError={(e) => {
                                // Fallback visual si la imagen aún no existe en la carpeta public/
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Crect width='240' height='240' fill='rgba(255,255,255,0.15)' rx='24'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' fill='rgba(255,255,255,0.8)' font-family='sans-serif' font-size='16' font-weight='bold'%3EColoca tu imagen en:%3C/text%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='sans-serif' font-size='14'%3Epublic/imagen-wizard-paso" + step + ".png%3C/text%3E%3C/svg%3E";
                            }}
                        />
                    </div>

                    <h2 className="text-white text-3xl font-extrabold text-center mb-3">
                        {step === 1 && "Configuración Inicial"}
                        {step === 2 && "Días y Grados"}
                        {step === 3 && "Estructura de Bloques"}
                        {step === 4 && "Creación de Secciones"}
                        {step === 5 && "Asignación de Turnos"}
                    </h2>
                    <p className="text-white/85 text-center text-[15px] max-w-xs leading-relaxed">
                        {step === 1 && "Establece el nombre de tu institución y configura la cantidad de sedes y turnos disponibles."}
                        {step === 2 && "Selecciona los días de la semana laborables y los grados académicos que impartes."}
                        {step === 3 && "Define exactamente cuántos bloques de clases se dictarán por cada día y grado."}
                        {step === 4 && "Crea las secciones o aulas específicas para los grados en cada una de tus sedes."}
                        {step === 5 && "Asigna un turno de estudio (ej. Mañana o Tarde) a las secciones creadas."}
                    </p>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, position: 'relative', zIndex: 10 }}>
                    © 2026 HorariX.
                </div>
            </div>

            {/* ===== RIGHT PANEL ===== */}
            <div
                className="flex-1 bg-white relative z-0 overflow-y-auto"
                style={{
                    transform: entered ? 'translateX(0)' : 'translateX(110%)',
                    transition: 'transform 0.7s ease-in-out',
                }}
            >
                <div className="absolute top-6 right-8 flex items-center gap-2 z-50">
                    <div className="w-10 h-10 rounded-full bg-[#790EEC]/10 flex items-center justify-center text-[#790EEC] font-bold cursor-pointer hover:bg-[#790EEC]/20 transition-colors" title="Perfil">
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

                <div className="min-h-full w-full flex flex-col items-center py-8">
                    <div style={{
                        width: '100%', maxWidth: 700,
                        margin: 'auto 0',
                        padding: '16px 32px 24px',
                        opacity: entered ? 1 : 0,
                        transition: 'opacity 0.3s ease 0.3s',
                    }}>
                        <div className="flex flex-col items-center justify-center mb-12 mt-4">
                            <div style={{
                                textAlign: 'center', fontSize: 11, fontWeight: 700,
                                letterSpacing: '0.15em', color: 'var(--color-hx-purple)',
                                textTransform: 'uppercase', marginBottom: 12,
                                transition: 'color 0.5s ease',
                            }}>
                                PASO {step} DE {totalSteps} • {step === 1 ? 'DATOS INICIALES' : step === 2 ? 'DÍAS Y GRADOS' : step === 3 ? 'BLOQUES POR DÍA' : step === 4 ? 'SECCIONES' : (step === 5 && totalSteps === 6) ? 'TURNOS' : '¡ÉXITO!'}
                            </div>

                            {/* Barra de progreso (movida desde abajo) */}
                            <div style={{ width: 240, height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${(step / totalSteps) * 100}%`,
                                    background: 'var(--color-hx-purple)',
                                    borderRadius: 999, transition: 'all 0.5s ease'
                                }}></div>
                            </div>
                        </div>

                        <div className="flex-grow flex flex-col justify-center w-full">
                            {step === 1 && (
                                <Paso1Institucion
                                    data={wizardData}
                                    setData={setWizardData}
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
                            {step === 5 && totalSteps === 6 && (
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
                            {step === totalSteps && (
                                <div className="flex flex-col items-center justify-center py-12 animate-fade-in" style={{ animationDuration: '0.8s' }}>
                                    <div className="w-24 h-24 bg-[#790EEC]/20 text-[#790EEC] rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,207,174,0.4)]">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight mb-4 text-center">¡Estructura Configurada!</h2>
                                    <p className="text-[#64748B] text-center max-w-md text-lg leading-relaxed">
                                        Tu institución está lista. Ahora vamos al Dashboard para agregar tus <strong className="text-[#790EEC]">Áreas, Cursos y Profesores</strong> a tu propio ritmo.
                                    </p>
                                </div>
                            )}

                            {/* Mensaje de Error Integrado muy cerca del formulario */}
                            {errorMsg && (
                                <div className="mt-2 mx-auto w-fit max-w-[500px] px-5 py-3 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center gap-2 animate-fade-in text-red-600 text-xs font-black uppercase tracking-widest shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    {errorMsg}
                                </div>
                            )}
                        </div>

                        {/* Botones de navegación */}
                        <div style={{ marginTop: 24, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                width: '100%', maxWidth: 400,
                                display: 'flex', gap: 16, marginBottom: 40,
                                justifyContent: step === 1 ? 'center' : 'space-between',
                            }}>
                                {step > 1 && (
                                    <button
                                        onClick={handleBack}
                                        className="cursor-pointer w-1/2 py-4 rounded-xl font-bold text-sm tracking-widest transition-all border-2 border-hx-purple text-hx-purple hover:bg-hx-purple/10"
                                    >
                                        VOLVER
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    disabled={isSaving}
                                    style={{
                                        width: step === 1 ? '100%' : '50%',
                                        background: isSaving ? 'rgba(121,14,236,0.5)' : 'var(--color-hx-purple)',
                                        color: 'white', fontWeight: 700,
                                        padding: '16px 0', borderRadius: 12,
                                        fontSize: 13, letterSpacing: '0.1em',
                                        border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSaving ? 'none' : '0 8px 20px -6px rgba(121,14,236,0.5)',
                                    }}
                                >
                                    {isSaving ? 'GUARDANDO...' : (step === totalSteps ? 'IR AL DASHBOARD' : 'CONTINUAR Y GUARDAR')}
                                </button>
                            </div>

                            {/* La barra de progreso fue movida a la cabecera superior */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
