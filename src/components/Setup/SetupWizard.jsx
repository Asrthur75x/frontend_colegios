import React, { useState, useEffect } from 'react';
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
    dias: [
        { id: 1, nombre: 'Lunes' },
        { id: 2, nombre: 'Martes' },
        { id: 3, nombre: 'Miércoles' },
        { id: 4, nombre: 'Jueves' },
        { id: 5, nombre: 'Viernes' }
    ],
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
                                newWizardData.dias = diasDb.map(d => ({ id: d.orden, nombre: d.nombre_dia }));
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
            // Ordenar días por su ID (orden lógico) antes de guardar
            const sortedDias = [...wizardData.dias].sort((a, b) => a.id - b.id);
            for (let d of sortedDias) {
                await fetch('http://127.0.0.1:8000/api/dias', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_dia: d.nombre, orden: d.id })
                });
            }

            // Ordenar grados de menor a mayor antes de guardar
            const sortedGrados = [...wizardData.grados].sort((a, b) => a - b);
            for (let g of sortedGrados) {
                await fetch('http://127.0.0.1:8000/api/grados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ numero: g })
                });
            }

            setSavedSteps(prev => prev.includes(2) ? prev : [...prev, 2]);
            setStep(prev => prev + 1);
        } catch (error) {
            console.error("Error al guardar días y grados:", error);
            setErrorMsg("Hubo un error guardando los datos del paso 2.");
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
                    const bloques = gradoDiaConfig[key];
                    const [gradoNumStr, diaIdStr] = key.split('-');
                    const gradoNum = parseInt(gradoNumStr);
                    const diaIdLocal = parseInt(diaIdStr);

                    // Buscar el ID real
                    const realGrado = gradosDb.find(g => g.numero === gradoNum);
                    const realDia = diasDb.find(d => d.orden === diaIdLocal);

                    if (realGrado && realDia && bloques > 0) {
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
                            throw new Error(`Error en el backend: ${response.status} - ${errorText}`);
                        }
                    } else {
                        console.warn(`No se encontraron IDs reales para Grado ${gradoNum} y Día ${diaIdLocal}`);
                    }
                }
            }

            setSavedSteps(prev => prev.includes(3) ? prev : [...prev, 3]);
            setStep(prev => prev + 1);
        } catch (error) {
            console.error("Error al guardar configuración de bloques:", error);
            setErrorMsg("Hubo un error guardando los datos del paso 3. Revisa la consola.");
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

                // Insertar ordenadamente
                for (const sec of seccionesAInsertar) {
                    const response = await fetch('http://127.0.0.1:8000/api/secciones', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_sede: sec.id_sede,
                            id_grado: sec.id_grado,
                            nombre: sec.nombre
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Error en el backend: ${response.status} - ${errorText}`);
                    }
                }
            }

            if (totalSteps === 6) {
                setSavedSteps(prev => prev.includes(4) ? prev : [...prev, 4]);
                setStep(5);
            } else {
                await autoAssignTurnoUnico();
                setSavedSteps(prev => prev.includes(4) ? prev : [...prev, 4]);
                setStep(5);
            }
        } catch (error) {
            console.error("Error al guardar configuración de secciones:", error);
            setErrorMsg("Hubo un error guardando los datos del paso 4. Revisa la consola.");
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

        for (const sec of seccionesDb) {
            for (const dia of diasDb) {
                await fetch('http://127.0.0.1:8000/api/seccion-turno', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_seccion: sec.id_seccion,
                        id_turno: turnoId,
                        id_dia: dia.id_dia
                    })
                });
            }
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
                                // MODO SIMPLE: mismo turno para todos los días
                                const realTurno = turnosDb.find(t => t.nombre === turnoValor);
                                if (realTurno) {
                                    for (const dia of diasDb) {
                                        await fetch('http://127.0.0.1:8000/api/seccion-turno', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                id_seccion: realSeccion.id_seccion,
                                                id_turno: realTurno.id_turno,
                                                id_dia: dia.id_dia
                                            })
                                        });
                                    }
                                }
                            } else if (typeof turnoValor === 'object' && turnoValor !== null) {
                                // MODO AVANZADO: turno diferente por día (diaId local → turnoNombre)
                                for (const [diaIdLocal, turnoNombre] of Object.entries(turnoValor)) {
                                    const realDia = diasDb.find(d => d.orden === parseInt(diaIdLocal));
                                    const realTurno = turnosDb.find(t => t.nombre === turnoNombre);
                                    if (realDia && realTurno) {
                                        await fetch('http://127.0.0.1:8000/api/seccion-turno', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                id_seccion: realSeccion.id_seccion,
                                                id_turno: realTurno.id_turno,
                                                id_dia: realDia.id_dia
                                            })
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            setSavedSteps(prev => prev.includes(5) ? prev : [...prev, 5]);
            setStep(6);
        } catch (error) {
            console.error("Error al guardar configuración de turnos:", error);
            setErrorMsg("Hubo un error guardando los datos del paso 5.");
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
                setErrorMsg('Por favor, completa todos los campos obligatorios.');
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
                setErrorMsg('Por favor, selecciona al menos un día y un grado.');
                return;
            }

            // Si el paso 2 ya fue guardado, solo avanzar sin volver a guardar
            if (savedSteps.includes(2)) {
                setStep(prev => prev + 1);
            } else {
                saveStep2Data();
            }
        } else if (step === 3) {
            setErrorMsg('');

            // Validación: Asegurar que todos los grados tengan al menos un bloque asignado
            const { gradoDiaConfig, grados } = wizardData;
            if (!gradoDiaConfig || Object.keys(gradoDiaConfig).length === 0) {
                setErrorMsg('Configuración inválida. Por favor, asigna los bloques por día.');
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
                setErrorMsg(`${mensaje} Asigna al menos un bloque en algún día de la semana.`);
                return;
            }

            if (savedSteps.includes(3)) {
                setStep(prev => prev + 1);
            } else {
                saveStep3Data();
            }
        } else if (step === 4) {
            setErrorMsg('');

            // Validación: Asegurar que todos los grados en todas las sedes tengan al menos 1 sección
            const { secciones, grados, sedes } = wizardData;
            if (!secciones) {
                setErrorMsg('Configuración inválida. Por favor, añade las secciones.');
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
                setErrorMsg(`Faltan secciones en: ${gradosSinSeccion.join(', ')}. Añade al menos una sección.`);
                return;
            }

            if (savedSteps.includes(4)) {
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
                    background: step === 1 ? 'var(--color-hx-purple)' : step === 2 ? 'var(--color-hx-blue)' : step === 3 ? 'var(--color-hx-yellow)' : step === 4 ? 'var(--color-hx-pink)' : 'var(--color-hx-teal)',
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
                            fill: step === 1 ? 'var(--color-hx-purple)' : step === 2 ? 'var(--color-hx-blue)' : step === 3 ? 'var(--color-hx-yellow)' : step === 4 ? 'var(--color-hx-pink)' : 'var(--color-hx-teal)',
                            transition: 'fill 0.5s ease'
                        }}>
                        <path d="M0,0 L0,1000 L20,1000 C150,750 -50,250 20,0 Z"></path>
                    </svg>
                </div>

                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 256, height: 256, background: '#10CFAE', opacity: 0.2, borderRadius: '50%', filter: 'blur(60px)' }}></div>
                <div style={{ position: 'absolute', top: '40%', left: '-20%', width: 320, height: 320, background: '#F3C252', opacity: 0.2, borderRadius: '50%', filter: 'blur(60px)' }}></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-[#790EEC] text-xl shadow-lg">Hx</div>
                    <span className="text-white text-2xl font-bold tracking-tight">HorariX</span>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center flex-grow mt-12">
                    <svg width="240" height="240" viewBox="0 0 240 240" fill="none"
                        className="mb-10 hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}>
                        {step === 1 && (
                            <>
                                <circle cx="120" cy="120" r="100" fill="#51B4E8" fillOpacity="0.2" />
                                <path d="M120 40 L190 160 H50 Z" fill="#10CFAE" fillOpacity="0.9" />
                                <rect x="90" y="100" width="60" height="60" rx="12" fill="#F3C252" fillOpacity="0.9" />
                                <circle cx="140" cy="140" r="25" fill="#F1A5B9" />
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <circle cx="120" cy="120" r="100" fill="#F1A5B9" fillOpacity="0.2" />
                                <rect x="80" y="80" width="80" height="80" rx="20" fill="#790EEC" fillOpacity="0.9" />
                                <circle cx="160" cy="80" r="30" fill="#F3C252" />
                                <path d="M80 180 Q120 130 160 180 Z" fill="#51B4E8" fillOpacity="0.9" />
                            </>
                        )}
                        {step === 3 && (
                            <>
                                <circle cx="120" cy="120" r="100" fill="var(--color-hx-purple)" fillOpacity="0.2" />
                                <rect x="60" y="90" width="120" height="60" rx="12" fill="var(--color-hx-teal)" fillOpacity="0.9" />
                                <circle cx="180" cy="150" r="25" fill="var(--color-hx-pink)" />
                                <path d="M120 40 L160 100 H80 Z" fill="var(--color-hx-blue)" fillOpacity="0.9" />
                            </>
                        )}
                        {step === 4 && (
                            <>
                                <circle cx="120" cy="120" r="100" fill="var(--color-hx-pink)" fillOpacity="0.2" />
                                <rect x="60" y="55" width="50" height="50" rx="10" fill="var(--color-hx-pink)" fillOpacity="0.9" />
                                <rect x="130" y="55" width="50" height="50" rx="10" fill="var(--color-hx-blue)" fillOpacity="0.9" />
                                <rect x="60" y="125" width="120" height="50" rx="10" fill="var(--color-hx-teal)" fillOpacity="0.9" />
                            </>
                        )}
                        {step === 5 && (
                            <>
                                <circle cx="120" cy="120" r="100" fill="var(--color-hx-teal)" fillOpacity="0.2" />
                                <rect x="50" y="80" width="140" height="80" rx="15" fill="var(--color-hx-teal)" fillOpacity="0.9" />
                                <circle cx="120" cy="120" r="20" fill="white" fillOpacity="0.3" />
                                <path d="M110 120 L118 128 L134 112" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            </>
                        )}
                    </svg>
                    <h2 style={{ color: 'white', fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>
                        Comienza la Magia
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontSize: 16, maxWidth: 260, lineHeight: 1.6 }}>
                        Moldea la estructura de tu institución de forma rápida y sencilla.
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
                        <div style={{
                            textAlign: 'center', fontSize: 11, fontWeight: 700,
                            letterSpacing: '0.15em',
                            color: step === 1 ? 'var(--color-hx-purple)' : step === 2 ? 'var(--color-hx-blue)' : step === 3 ? '#d49e24' : step === 4 ? 'var(--color-hx-pink)' : 'var(--color-hx-teal)',
                            textTransform: 'uppercase', marginBottom: 48, marginTop: 16,
                            transition: 'color 0.5s ease',
                        }}>
                            PASO {step} DE {totalSteps} • {step === 1 ? 'DATOS INICIALES' : step === 2 ? 'DÍAS Y GRADOS' : step === 3 ? 'BLOQUES POR DÍA' : step === 4 ? 'SECCIONES' : (step === 5 && totalSteps === 6) ? 'TURNOS' : '¡ÉXITO!'}
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
                                    <Paso2DiasGrados data={wizardData} setData={setWizardData} />
                                </div>
                            )}
                            {step === 3 && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso3GradoDiaConfig data={wizardData} setData={setWizardData} />
                                </div>
                            )}
                            {step === 4 && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso4Secciones data={wizardData} setData={setWizardData} />
                                </div>
                            )}
                            {step === 5 && totalSteps === 6 && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso5Turnos data={wizardData} setData={setWizardData} />
                                </div>
                            )}
                            {step === totalSteps && (
                                <div className="flex flex-col items-center justify-center py-12 animate-fade-in" style={{ animationDuration: '0.8s' }}>
                                    <div className="w-24 h-24 bg-[#10CFAE]/20 text-[#10CFAE] rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,207,174,0.4)]">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight mb-4 text-center">¡Estructura Configurada!</h2>
                                    <p className="text-[#64748B] text-center max-w-md text-lg leading-relaxed">
                                        Tu institución está lista. Ahora vamos al Dashboard para agregar tus <strong className="text-[#790EEC]">Áreas, Cursos y Profesores</strong> a tu propio ritmo.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Botones de navegación */}
                        <div style={{ marginTop: 40, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {errorMsg && (
                                <div className="w-full max-w-[400px] mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 animate-fade-in text-red-500 text-sm font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    {errorMsg}
                                </div>
                            )}
                            <div style={{
                                width: '100%', maxWidth: 400,
                                display: 'flex', gap: 16, marginBottom: 40,
                                justifyContent: step === 1 ? 'center' : 'space-between',
                            }}>
                                {step > 1 && (
                                    <button
                                        onClick={handleBack}
                                        className={`cursor-pointer w-1/2 py-4 rounded-xl font-bold text-sm tracking-widest transition-all border-2 
                                            ${step === 2 ? 'border-hx-blue text-hx-blue hover:bg-hx-blue/5'
                                                : step === 3 ? 'border-hx-yellow text-[#d49e24] hover:bg-hx-yellow/10'
                                                    : step === 4 ? 'border-hx-pink text-[#c25071] hover:bg-hx-pink/10'
                                                        : 'border-hx-teal text-hx-teal hover:bg-hx-teal/10'}`}
                                    >
                                        VOLVER
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    disabled={isSaving}
                                    style={{
                                        width: step === 1 ? '100%' : '50%',
                                        background: isSaving
                                            ? (step === 1 ? 'rgba(121,14,236,0.5)' : step === 2 ? 'rgba(81,180,232,0.5)' : step === 3 ? 'rgba(243,194,82,0.5)' : step === 4 ? 'rgba(241,165,185,0.5)' : 'rgba(16,207,174,0.5)')
                                            : (step === 1 ? 'var(--color-hx-purple)' : step === 2 ? 'var(--color-hx-blue)' : step === 3 ? 'var(--color-hx-yellow)' : step === 4 ? 'var(--color-hx-pink)' : 'var(--color-hx-teal)'),
                                        color: 'white', fontWeight: 700,
                                        padding: '16px 0', borderRadius: 12,
                                        fontSize: 13, letterSpacing: '0.1em',
                                        border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSaving ? 'none' : (step === 1 ? '0 8px 20px -6px rgba(121,14,236,0.5)' : step === 2 ? '0 8px 20px -6px rgba(81,180,232,0.5)' : step === 3 ? '0 8px 20px -6px rgba(243,194,82,0.5)' : step === 4 ? '0 8px 20px -6px rgba(241,165,185,0.5)' : '0 8px 20px -6px rgba(16,207,174,0.5)'),
                                    }}
                                >
                                    {isSaving ? 'GUARDANDO...' : (step === totalSteps ? 'IR AL DASHBOARD' : 'CONTINUAR Y GUARDAR')}
                                </button>
                            </div>

                            {/* Barra de progreso */}
                            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
                                {step} DE {totalSteps}
                            </div>
                            <div style={{ width: 192, height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(step / totalSteps) * 100}%`,
                                    background: step === 1 ? 'var(--color-hx-purple)' : step === 2 ? 'var(--color-hx-blue)' : step === 3 ? 'var(--color-hx-yellow)' : step === 4 ? 'var(--color-hx-pink)' : 'var(--color-hx-teal)',
                                    borderRadius: 999, transition: 'all 0.5s ease'
                                }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
