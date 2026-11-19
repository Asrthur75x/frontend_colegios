import React, { useState, useEffect, useRef } from 'react';
import { sileo } from 'sileo';

import { getSession, hasPermission } from '../../lib/auth/session';
import {
    ajustesCrud, getAjustesData, listConfigs, listSeccionTurnos,
    getColegio, updateColegio, saveGradoDiaConfig, syncTurnoSeccion, parseWholeNumber,
} from '../../services/ajustes';

export default function AjustesManager() {
    const [activeTab, setActiveTab] = useState('institucion');
    const [sessionReady, setSessionReady] = useState(false);
    useEffect(() => {
        try {
            const saved = localStorage.getItem('ajustes_active_tab');
            if (['institucion', 'organizacion', 'estructura'].includes(saved)) setActiveTab(saved);
        } catch { /* Tab persistence is optional. */ }
        setSessionReady(true);
    }, []);
    useEffect(() => {
        if (!sessionReady) return;
        try { localStorage.setItem('ajustes_active_tab', activeTab); } catch { /* Optional. */ }
    }, [sessionReady, activeTab]);
    const [loading, setLoading] = useState(true);

    // --- State: Institución ---
    const [colegio, setColegio] = useState(null);
    const [sedes, setSedes] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [newSede, setNewSede] = useState('');
    const [newTurno, setNewTurno] = useState('');

    // --- State: Organización ---
    const [dias, setDias] = useState([]);
    const [grados, setGrados] = useState([]);
    const [gradoDiaConfig, setGradoDiaConfig] = useState([]);
    const [newGrado, setNewGrado] = useState('');

    // --- State: Estructura ---
    const [secciones, setSecciones] = useState([]);
    const [seccionTurnos, setSeccionTurnos] = useState([]);
    const [newSeccionGrado, setNewSeccionGrado] = useState('');
    const [newSeccionSede, setNewSeccionSede] = useState('');
    const [newSeccionNombre, setNewSeccionNombre] = useState('');
    const [selectedSeccionId, setSelectedSeccionId] = useState('');
    const [selectedTurnoId, setSelectedTurnoId] = useState('');
    const [filtroSeccionGrado, setFiltroSeccionGrado] = useState('');
    const [filtroSeccionSede, setFiltroSeccionSede] = useState('');

    // --- State: Edición Visual ---
    const [isEditingColegio, setIsEditingColegio] = useState(false);
    const [editColegioValue, setEditColegioValue] = useState('');
    const [editingSedeId, setEditingSedeId] = useState(null);
    const [editSedeValue, setEditSedeValue] = useState('');
    const [editingTurnoId, setEditingTurnoId] = useState(null);
    const [editTurnoValue, setEditTurnoValue] = useState('');
    const [editingGradoId, setEditingGradoId] = useState(null);
    const [editGradoValue, setEditGradoValue] = useState('');
    const [editingSeccionId, setEditingSeccionId] = useState(null);
    const [editSeccionNombre, setEditSeccionNombre] = useState('');
    const [editSeccionGrado, setEditSeccionGrado] = useState('');
    const [editSeccionSede, setEditSeccionSede] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const showToast = (msg, type = 'success') => {
        const baseOptions = {
            description: msg,
            duration: 3000,
            position: 'top-center',
        };

        if (type === 'error') {
            sileo.error({
                ...baseOptions,
                fill: '#DC2626',
                styles: {
                    description: '!text-white font-bold !text-center flex-1',
                    badge: '!bg-red-800 !text-white',
                    button: '!bg-red-800 hover:!bg-red-900 !text-white'
                }
            });
        } else {
            sileo.success({
                ...baseOptions,
                fill: '#10B981',
                styles: {
                    description: '!text-white font-bold !text-center flex-1',
                    badge: '!bg-emerald-700 !text-white',
                    button: '!bg-emerald-700 hover:!bg-emerald-800 !text-white'
                }
            });
        }
    };

    const [reload, setReload] = useState(0);
    const [loadError, setLoadError] = useState(null);
    const [operationError, setOperationError] = useState(null);
    const [institutionError, setInstitutionError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dataFresh, setDataFresh] = useState(true);
    const [configDrafts, setConfigDrafts] = useState({});
    const busyRef = useRef(false);
    const session = sessionReady ? getSession() : null;
    const can = (resource, action) => sessionReady && hasPermission(`horarios:${resource}:${action}`);
    const canRead = resource => can(resource, 'view');
    const resources = ['sede', 'turno', 'dia', 'grado', 'grado_dia_config', 'seccion', 'seccion_turno'];
    const resourceLabels = { sede: 'sedes', turno: 'turnos', dia: 'días', grado: 'grados', grado_dia_config: 'bloques por día', seccion: 'secciones', seccion_turno: 'turnos por sección' };
    const hasAnyView = resources.some(canRead);
    const canReadColegio = sessionReady && hasPermission('platform:tenant:view');
    const canEditColegio = canReadColegio && hasPermission('platform:tenant:edit');
    const permissions = resource => ({ canAdd: can(resource, 'add'), canEdit: can(resource, 'edit'), canDelete: can(resource, 'delete') });

    useEffect(() => {
        if (!sessionReady || !hasAnyView) return;
        let active = true;
        setLoading(true);
        setLoadError(null);
        getAjustesData(canRead).then(data => {
            if (!active) return;
            setSedes(data.sedes);
            setTurnos(data.turnos);
            setDias([...data.dias].sort((a, b) => a.orden - b.orden));
            setGrados([...data.grados].sort((a, b) => a.numero - b.numero));
            setGradoDiaConfig(data.configs);
            setSecciones(data.secciones);
            setSeccionTurnos(data.seccionTurnos);
            setDataFresh(true);
            setOperationError(null);
        }).catch(err => { if (active) setLoadError(err.message); })
            .finally(() => { if (active) setLoading(false); });
        if (canReadColegio && session?.user.tenant_id) {
            setInstitutionError(null);
            getColegio(session.user.tenant_id).then(data => { if (active) setColegio(data); })
                .catch(err => { if (active) setInstitutionError(err.message); });
        }
        return () => { active = false; };
    }, [sessionReady, hasAnyView, reload]);

    const refreshResource = async resource => {
        if (resource === 'sede') setSedes(await ajustesCrud.sede.list());
        else if (resource === 'turno') setTurnos(await ajustesCrud.turno.list());
        else if (resource === 'grado') setGrados([...(await ajustesCrud.grado.list())].sort((a, b) => a.numero - b.numero));
        else if (resource === 'seccion') setSecciones(await ajustesCrud.seccion.list());
        else if (resource === 'grado_dia_config') setGradoDiaConfig(await listConfigs());
        else if (resource === 'seccion_turno') setSeccionTurnos(await listSeccionTurnos());
        else if (resource === 'colegio') setColegio(await getColegio(session.user.tenant_id));
    };

    const mutate = async (allowed, resource, operation, message, after = () => {}) => {
        if (busyRef.current || !dataFresh) return;
        if (!allowed) { setOperationError('No tienes permiso para realizar esta operación.'); return; }
        busyRef.current = true;
        setSaving(true);
        setOperationError(null);
        let committed = false;
        try {
            await operation();
            committed = true;
            after();
            setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
            showToast(message);
        } catch (err) {
            setOperationError(err.message);
            showToast(err.message, 'error');
        } finally {
            try { await refreshResource(resource); }
            catch (err) {
                setDataFresh(false);
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
                setOperationError(`${committed ? 'El cambio se guardó. ' : ''}No se pudo actualizar la lista: ${err.message}. Recarga los datos antes de continuar.`);
            }
            if (committed) {
                window.dispatchEvent(new Event('edusync_data_updated'));
                window.dispatchEvent(new Event('horarix_data_updated'));
            }
            busyRef.current = false;
            setSaving(false);
        }
    };

    const text = value => {
        const clean = value.trim();
        if (!clean || clean.length > 256) throw new Error('Ingresa un nombre de entre 1 y 256 caracteres.');
        return clean;
    };
    const requestDelete = (resource, id, label) => {
        if (!can(resource, 'delete') || busyRef.current) return;
        setOperationError(null);
        setConfirmDialog({ isOpen: true, title: `Eliminar ${label}`, message: `¿Deseas eliminar este registro de ${label}?`,
            onConfirm: () => mutate(can(resource, 'delete'), resource, () => ajustesCrud[resource].delete(id), 'Registro eliminado.') });
    };

    const handleUpdateColegio = () => mutate(canEditColegio && colegio, 'colegio',
        () => updateColegio(session.user.tenant_id, text(editColegioValue)), 'Nombre guardado.', () => setIsEditingColegio(false));
    const handleAddSede = () => mutate(can('sede', 'add') && canRead('sede'), 'sede',
        () => ajustesCrud.sede.create({ nombre_sede: text(newSede) }), 'Sede añadida.', () => setNewSede(''));
    const handleUpdateSede = id => mutate(can('sede', 'edit') && canRead('sede'), 'sede',
        () => ajustesCrud.sede.update(id, { nombre_sede: text(editSedeValue) }), 'Sede actualizada.', () => setEditingSedeId(null));
    const handleDeleteSede = id => requestDelete('sede', id, 'sede');
    const handleAddTurno = () => mutate(can('turno', 'add') && canRead('turno'), 'turno',
        () => ajustesCrud.turno.create({ nombre: text(newTurno) }), 'Turno añadido.', () => setNewTurno(''));
    const handleUpdateTurno = id => mutate(can('turno', 'edit') && canRead('turno'), 'turno',
        () => ajustesCrud.turno.update(id, { nombre: text(editTurnoValue) }), 'Turno actualizado.', () => setEditingTurnoId(null));
    const handleDeleteTurno = id => requestDelete('turno', id, 'turno');
    const handleAddGrado = () => mutate(can('grado', 'add') && canRead('grado'), 'grado',
        () => ajustesCrud.grado.create({ numero: parseWholeNumber(newGrado, 1) }), 'Grado añadido.', () => setNewGrado(''));
    const handleUpdateGrado = id => mutate(can('grado', 'edit') && canRead('grado'), 'grado',
        () => ajustesCrud.grado.update(id, { numero: parseWholeNumber(editGradoValue, 1) }), 'Grado actualizado.', () => setEditingGradoId(null));
    const handleDeleteGrado = id => requestDelete('grado', id, 'grado');
    const handleUpdateGradoDiaConfig = (idGrado, idDia, value) => {
        const existing = gradoDiaConfig.find(c => c.id_grado === idGrado && c.id_dia === idDia);
        if (String(existing?.bloques_dia ?? 0) === String(value)) return;
        return mutate(canRead('grado_dia_config'), 'grado_dia_config',
            () => saveGradoDiaConfig(idGrado, idDia, value, permissions('grado_dia_config')), 'Bloques actualizados.',
            () => setConfigDrafts(prev => { const next = { ...prev }; delete next[`${idGrado}:${idDia}`]; return next; }));
    };
    const seccionBody = (nombre, grado, sede) => ({ nombre: text(nombre), id_grado: parseWholeNumber(grado, 1), id_sede: parseWholeNumber(sede, 1) });
    const handleAddSeccion = () => mutate(can('seccion', 'add') && canRead('seccion'), 'seccion',
        () => ajustesCrud.seccion.create(seccionBody(newSeccionNombre, newSeccionGrado, newSeccionSede)), 'Sección añadida.', () => setNewSeccionNombre(''));
    const handleUpdateSeccion = id => mutate(can('seccion', 'edit') && canRead('seccion'), 'seccion',
        () => ajustesCrud.seccion.update(id, seccionBody(editSeccionNombre, editSeccionGrado, editSeccionSede)), 'Sección actualizada.', () => setEditingSeccionId(null));
    const handleDeleteSeccion = id => requestDelete('seccion', id, 'sección');
    const handleAssignTurno = () => mutate(canRead('seccion_turno') && canRead('grado_dia_config') && canRead('dia'), 'seccion_turno', async () => {
        const seccionId = parseWholeNumber(selectedSeccionId, 1);
        const turnoId = parseWholeNumber(selectedTurnoId, 1);
        const gradoId = secciones.find(s => s.id === seccionId)?.id_grado;
        const enabled = dias.filter(d => gradoDiaConfig.some(c => c.id_grado === gradoId && c.id_dia === d.id && c.bloques_dia > 0)).map(d => d.id);
        await syncTurnoSeccion(seccionId, turnoId, enabled, permissions('seccion_turno'));
    }, 'Turno asignado en los días configurados.', () => { setSelectedSeccionId(''); setSelectedTurnoId(''); });

    // ===== HELPERS VISUALES =====
    const EditIcon = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
    );
    const DeleteIcon = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
    );
    const CloseIcon = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
    );
    const CheckIcon = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    );

    const TABS = [
        { id: 'institucion', label: 'Institución', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { id: 'organizacion', label: 'Organización', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'estructura', label: 'Estructura', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
    ];

    if (!sessionReady || (hasAnyView && loading)) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>

        </div>
    );

    if (!hasAnyView) return <p role="alert">No tienes permiso para consultar los ajustes.</p>;
    if (loadError) return <div role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
        <p>{loadError}</p><button onClick={() => setReload(value => value + 1)} className="mt-2 font-bold underline">Reintentar carga</button>
    </div>;
    return (<>
        {operationError && <div role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-red-700">
            <p>{operationError}</p>
            {!dataFresh && <button disabled={saving} onClick={() => setReload(value => value + 1)} className="mt-2 font-bold underline">Recargar datos</button>}
        </div>}
        {resources.some(r => !canRead(r)) && <p className="mb-4 text-sm text-slate-500">Algunos datos no están disponibles con los permisos de tu sesión: {resources.filter(r => !canRead(r)).map(r => resourceLabels[r]).join(', ')}.</p>}
        <fieldset disabled={saving || !dataFresh} className="w-full min-w-0 flex gap-8 h-[calc(100vh-18rem)]">
            {/* Sidebar Interno */}
            <div className="w-64 flex-shrink-0 h-full flex flex-col">
                <nav className="flex flex-col gap-2 flex-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm cursor-pointer ${activeTab === tab.id
                                ? 'bg-[var(--color-brand-dark)] text-white shadow-md shadow-[#2F5BFF]/20'
                                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 hover:border-slate-200'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d={tab.icon}></path>
                            </svg>
                            {tab.label}
                        </button>
                    ))}

                    {/* Resumen Stats */}
                    <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resumen General</h4>
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between bg-[#DCE6FF]/60 rounded-xl px-3 py-2.5 border border-[#2F5BFF]/15">
                                <span className="text-[11px] font-bold text-slate-500">Sedes</span>
                                <span className="text-sm font-black text-[var(--color-brand-primary)]">{canRead('sede') ? sedes.length : '—'}</span>
                            </div>
                            <div className="flex items-center justify-between bg-[#DCE6FF]/60 rounded-xl px-3 py-2.5 border border-[#2F5BFF]/15">
                                <span className="text-[11px] font-bold text-slate-500">Grados</span>
                                <span className="text-sm font-black text-[var(--color-brand-primary)]">{canRead('grado') ? grados.length : '—'}</span>
                            </div>
                            <div className="flex items-center justify-between bg-[#DCE6FF]/60 rounded-xl px-3 py-2.5 border border-[#2F5BFF]/15">
                                <span className="text-[11px] font-bold text-slate-500">Secciones</span>
                                <span className="text-sm font-black text-[var(--color-brand-primary)]">{canRead('seccion') ? secciones.length : '—'}</span>
                            </div>
                            <div className="flex items-center justify-between bg-[#DCE6FF]/60 rounded-xl px-3 py-2.5 border border-[#2F5BFF]/15">
                                <span className="text-[11px] font-bold text-slate-500">Turnos</span>
                                <span className="text-sm font-black text-[var(--color-brand-primary)]">{canRead('turno') ? turnos.length : '—'}</span>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Contenido Principal */}
            <div className="flex-1 overflow-y-auto pr-4 pb-8 custom-scrollbar">

                {/* --- PESTAÑA INSTITUCIÓN --- */}
                {activeTab === 'institucion' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 mb-2">Institución educativa</h3>
                            <p className="text-xs text-slate-500 mb-4">Colegio de la sesión: {session?.user.schema_name}</p>
                            {institutionError && <p role="alert" className="text-sm text-red-600 mb-3">{institutionError}</p>}
                            {colegio ? <>
                                {isEditingColegio ? <div className="flex gap-2">
                                    <input aria-label="Nombre oficial del colegio" maxLength={256} value={editColegioValue} onChange={e => setEditColegioValue(e.target.value)} className="flex-1 rounded-xl border p-3 text-sm" />
                                    <button onClick={handleUpdateColegio} className="rounded-xl bg-[var(--color-brand-primary)] px-4 text-white font-bold">Guardar</button>
                                    <button onClick={() => setIsEditingColegio(false)} className="rounded-xl bg-slate-100 px-4">Cancelar</button>
                                </div> : <div className="flex justify-between items-center gap-4">
                                    <p className="font-bold text-slate-700">{colegio.display_name}</p>
                                    {canEditColegio && <button onClick={() => { setEditColegioValue(colegio.display_name); setIsEditingColegio(true); }} className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white font-bold">Editar nombre</button>}
                                </div>}
                            </> : <p className="text-sm text-slate-500">El nombre oficial del colegio se administra desde la cuenta de plataforma.</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Sedes */}
                            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <svg className="size-8 text-[var(--color-brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-800">Gestión de Sedes</h3>
                                        <p className="text-[11px] text-slate-400 font-medium">{sedes.length} sede{sedes.length !== 1 ? 's' : ''} registrada{sedes.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text" placeholder="Nombre de nueva sede..." value={newSede} onChange={e => setNewSede(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddSede()}
                                        className="flex-1 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[#2F5BFF]/10 transition-all"
                                    />
                                    <button onClick={handleAddSede} disabled={!(canRead('sede') && can('sede', 'add')) || (newSede.trim().length < 3)} className={`px-4 py-2.5 font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 ${newSede.trim().length >= 3 ? 'bg-[var(--color-brand-primary)] text-white cursor-pointer hover:shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        Agregar
                                    </button>
                                </div>
                                <ul className="space-y-2">
                                    {sedes.map(s => (
                                        <li key={s.id} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 group hover:border-slate-200 transition-colors">
                                            {editingSedeId === s.id ? (
                                                <input
                                                    type="text"
                                                    value={editSedeValue}
                                                    onChange={e => setEditSedeValue(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdateSede(s.id)}
                                                    className="flex-1 bg-white border border-[#2F5BFF]/15 text-sm font-bold rounded-lg px-3 py-1.5 outline-none mr-3 focus:ring-2 focus:ring-[#2F5BFF]/10"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-bold text-sm text-slate-700 flex-1 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] flex-shrink-0"></span>
                                                    {s.nombre_sede}
                                                </span>
                                            )}
                                            <div className="flex gap-1">
                                                {editingSedeId === s.id ? (
                                                    <>
                                                        <button disabled={!(canRead('sede') && can('sede', 'edit'))} onClick={() => handleUpdateSede(s.id)} className="text-white bg-[var(--color-brand-primary)] p-1.5 rounded-lg cursor-pointer hover:shadow-sm transition-all" title="Guardar"><CheckIcon /></button>
                                                        <button onClick={() => setEditingSedeId(null)} className="text-slate-400 bg-slate-200 p-1.5 rounded-lg cursor-pointer hover:bg-slate-300 transition-all" title="Cancelar"><CloseIcon /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button disabled={!(canRead('sede') && can('sede', 'edit'))} onClick={() => { setEditingSedeId(s.id); setEditSedeValue(s.nombre_sede); }} className="text-slate-400 hover:text-[var(--color-brand-primary)] p-1.5 cursor-pointer transition-all hover:bg-[#2F5BFF]/10 rounded-lg" title="Editar">
                                                            <EditIcon />
                                                        </button>
                                                        <button disabled={!(canRead('sede') && can('sede', 'delete'))} onClick={() => handleDeleteSede(s.id)} className="text-slate-400 hover:text-red-500 p-1.5 cursor-pointer transition-all hover:bg-red-50 rounded-lg" title="Eliminar">
                                                            <DeleteIcon />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                    {sedes.length === 0 && (
                                        <li className="py-6 text-center text-slate-400 font-medium text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">No hay sedes registradas.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Turnos */}
                            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <svg className="size-8 text-[var(--color-brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-800">Gestión de Turnos</h3>
                                        <p className="text-[11px] text-slate-400 font-medium">{turnos.length} turno{turnos.length !== 1 ? 's' : ''} registrado{turnos.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text" placeholder="Nombre de nuevo turno..." value={newTurno} onChange={e => setNewTurno(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddTurno()}
                                        className="flex-1 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[#2F5BFF]/10 transition-all"
                                    />
                                    <button onClick={handleAddTurno} disabled={!(canRead('turno') && can('turno', 'add')) || (newTurno.trim().length < 3)} className={`px-4 py-2.5 font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 ${newTurno.trim().length >= 3 ? 'bg-[var(--color-brand-primary)] text-white cursor-pointer hover:shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        Agregar
                                    </button>
                                </div>
                                <ul className="space-y-2">
                                    {turnos.map(t => (
                                        <li key={t.id} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 group hover:border-slate-200 transition-colors">
                                            {editingTurnoId === t.id ? (
                                                <input
                                                    type="text"
                                                    value={editTurnoValue}
                                                    onChange={e => setEditTurnoValue(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdateTurno(t.id)}
                                                    className="flex-1 bg-white border border-[#2F5BFF]/15 text-sm font-bold rounded-lg px-3 py-1.5 outline-none mr-3 focus:ring-2 focus:ring-[#2F5BFF]/10"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-bold text-sm text-slate-700 flex-1 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] flex-shrink-0"></span>
                                                    {t.nombre}
                                                </span>
                                            )}
                                            <div className="flex gap-1">
                                                {editingTurnoId === t.id ? (
                                                    <>
                                                        <button disabled={!(canRead('turno') && can('turno', 'edit'))} onClick={() => handleUpdateTurno(t.id)} className="text-white bg-[var(--color-brand-primary)] p-1.5 rounded-lg cursor-pointer hover:shadow-sm transition-all" title="Guardar"><CheckIcon /></button>
                                                        <button onClick={() => setEditingTurnoId(null)} className="text-slate-400 bg-slate-200 p-1.5 rounded-lg cursor-pointer hover:bg-slate-300 transition-all" title="Cancelar"><CloseIcon /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button disabled={!(canRead('turno') && can('turno', 'edit'))} onClick={() => { setEditingTurnoId(t.id); setEditTurnoValue(t.nombre); }} className="text-slate-400 hover:text-[var(--color-brand-primary)] p-1.5 cursor-pointer transition-all hover:bg-[#2F5BFF]/10 rounded-lg" title="Editar">
                                                            <EditIcon />
                                                        </button>
                                                        <button disabled={!(canRead('turno') && can('turno', 'delete'))} onClick={() => handleDeleteTurno(t.id)} className="text-slate-400 hover:text-red-500 p-1.5 cursor-pointer transition-all hover:bg-red-50 rounded-lg" title="Eliminar">
                                                            <DeleteIcon />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                    {turnos.length === 0 && (
                                        <li className="py-6 text-center text-slate-400 font-medium text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">No hay turnos registrados.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA ORGANIZACIÓN --- */}
                {activeTab === 'organizacion' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="size-8 text-[var(--color-brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Grados y Bloques por Día</h3>
                                    <p className="text-xs text-slate-400 font-medium">Configura cuántas horas tiene cada grado por día de la semana</p>
                                </div>
                            </div>

                            {/* Añadir grado */}
                            <div className="flex gap-2 mb-6 max-w-md">
                                <input
                                    type="number" placeholder="Número de Grado (Ej: 6)" value={newGrado} onChange={e => setNewGrado(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddGrado()}
                                    className="flex-1 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[#2F5BFF]/10 transition-all"
                                />
                                <button onClick={handleAddGrado} disabled={!(canRead('grado') && can('grado', 'add')) || (!newGrado.trim())} className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 ${newGrado.trim() ? 'bg-[var(--color-brand-primary)] text-white cursor-pointer hover:shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Añadir Grado
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="pb-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Grado</th>
                                            {dias.map(d => (
                                                <th key={d.id} className="pb-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                    {d.nombre_dia.slice(0, 3)}
                                                </th>
                                            ))}
                                            <th className="pb-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                            <th className="pb-3 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grados.map(g => {
                                            const totalBloques = dias.reduce((sum, d) => {
                                                const conf = gradoDiaConfig.find(c => c.id_grado === g.id && c.id_dia === d.id);
                                                return sum + (conf ? conf.bloques_dia : 0);
                                            }, 0);
                                            return (
                                                <tr key={g.id} className="border-t border-slate-100 group hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 pl-2">
                                                        {editingGradoId === g.id ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="number"
                                                                    value={editGradoValue}
                                                                    onChange={e => setEditGradoValue(e.target.value)}
                                                                    onKeyDown={e => e.key === 'Enter' && handleUpdateGrado(g.id)}
                                                                    className="w-16 text-center bg-white border border-[#2F5BFF]/15 rounded-lg py-1.5 text-sm font-black outline-none focus:ring-2 focus:ring-[#2F5BFF]/10"
                                                                    autoFocus
                                                                />
                                                                <button disabled={!(canRead('grado') && can('grado', 'edit'))} onClick={() => handleUpdateGrado(g.id)} className="text-white bg-[var(--color-brand-primary)] p-1 rounded-lg cursor-pointer" title="Guardar"><CheckIcon /></button>
                                                                <button onClick={() => setEditingGradoId(null)} className="text-slate-400 bg-slate-200 p-1 rounded-lg cursor-pointer" title="Cancelar"><CloseIcon /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-slate-800 text-lg">{g.numero}°</span>
                                                                <button disabled={!(canRead('grado') && can('grado', 'edit'))} onClick={() => { setEditingGradoId(g.id); setEditGradoValue(String(g.numero)); }} className="text-slate-400 hover:text-[var(--color-brand-primary)] p-1 cursor-pointer transition-all hover:bg-[#2F5BFF]/10 rounded-lg" title="Editar grado">
                                                                    <EditIcon />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    {dias.map(d => {
                                                        const conf = gradoDiaConfig.find(c => c.id_grado === g.id && c.id_dia === d.id);
                                                        const bloques = conf?.bloques_dia ?? 0;
                                                        return (
                                                            <td key={d.id} className="py-4 px-2 text-center">
                                                                <input
                                                                    type="number" min="0" max="15"
                                                                    value={configDrafts[`${g.id}:${d.id}`] ?? bloques}
                                                                    disabled={!canRead('grado_dia_config') || !['add', 'edit', 'delete'].some(action => can('grado_dia_config', action))}
                                                                    onChange={e => setConfigDrafts(prev => ({ ...prev, [`${g.id}:${d.id}`]: e.target.value }))}
                                                                    onBlur={e => handleUpdateGradoDiaConfig(g.id, d.id, e.target.value)}
                                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                                                                    className={`w-16 text-center border rounded-lg py-1.5 text-sm font-bold outline-none mx-auto transition-all ${bloques > 0 ? 'bg-[var(--color-brand-light)] border-[#2F5BFF]/15 text-[var(--color-brand-dark)] focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[#2F5BFF]/10' : 'bg-slate-50 border-slate-200 text-slate-400 focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[#2F5BFF]/10'}`}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-sm font-black ${totalBloques > 0 ? 'bg-[#2F5BFF]/10 text-[var(--color-brand-primary)]' : 'bg-slate-100 text-slate-400'}`}>
                                                            {totalBloques}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right pr-2">
                                                        <button disabled={!(canRead('grado') && can('grado', 'delete'))} onClick={() => handleDeleteGrado(g.id)} className="text-slate-400 hover:text-red-500 font-bold text-sm p-1.5 cursor-pointer transition-all hover:bg-red-50 rounded-lg" title="Eliminar grado">
                                                            <DeleteIcon />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {grados.length === 0 && (
                                            <tr><td colSpan={dias.length + 3} className="py-10 text-center text-slate-400 font-medium">No hay grados registrados. Añade uno para configurar sus bloques.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA ESTRUCTURA --- */}
                {activeTab === 'estructura' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="size-8 text-[var(--color-brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Creación de Secciones</h3>
                                    <p className="text-xs text-slate-400 font-medium">Agrega secciones (ej: A, B, C) a cada grado y asígnales un turno</p>
                                </div>
                            </div>

                            {/* Formulario de creación */}
                            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 mb-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nueva Sección</p>
                                <div className="flex flex-wrap gap-3 items-end">
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Grado</label>
                                        <select value={newSeccionGrado} onChange={e => setNewSeccionGrado(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-brand-primary)] cursor-pointer transition-all">
                                            <option value="">Seleccionar...</option>
                                            {grados.map(g => <option key={g.id} value={g.id}>{g.numero}° Grado</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Sede</label>
                                        <select value={newSeccionSede} onChange={e => setNewSeccionSede(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-brand-primary)] cursor-pointer transition-all">
                                            <option value="">Seleccionar...</option>
                                            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre_sede}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[120px]">
                                        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Nombre</label>
                                        <input
                                            type="text" placeholder="Ej: A, B, 1A" value={newSeccionNombre} onChange={e => setNewSeccionNombre(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddSeccion()}
                                            className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[#2F5BFF]/10 transition-all"
                                        />
                                    </div>
                                    <button onClick={handleAddSeccion} disabled={!(canRead('seccion') && can('seccion', 'add')) || (!newSeccionNombre.trim() || !newSeccionGrado || !newSeccionSede)} className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${newSeccionNombre.trim() && newSeccionGrado && newSeccionSede ? 'bg-[var(--color-brand-primary)] text-white cursor-pointer hover:shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        Añadir Sección
                                    </button>
                                </div>
                            </div>

                            {/* Asignar Turno */}
                            <div className="bg-[#DCE6FF]/60 p-5 rounded-2xl border border-[#2F5BFF]/15 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-light)] flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <p className="text-sm font-black text-slate-700">Asignar Turno a Sección</p>
                                </div>
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Sección</label>
                                        <select value={selectedSeccionId} onChange={e => setSelectedSeccionId(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-brand-primary)] cursor-pointer transition-all">
                                            <option value="">-- Elige una sección --</option>
                                            {secciones.map(sec => (
                                                <option key={sec.id} value={sec.id}>{sec.nombre} (Grado {grados.find(g => g.id === sec.id_grado)?.numero}°)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Turno</label>
                                        <select value={selectedTurnoId} onChange={e => setSelectedTurnoId(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-brand-primary)] cursor-pointer transition-all">
                                            <option value="">-- Elige un turno --</option>
                                            {turnos.map(t => (
                                                <option key={t.id} value={t.id}>{t.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button onClick={handleAssignTurno} disabled={!(canRead('seccion_turno') && canRead('grado_dia_config') && canRead('dia') && ['add', 'edit', 'delete'].some(action => can('seccion_turno', action))) || (!selectedSeccionId || !selectedTurnoId)} className="px-5 py-2.5 bg-[var(--color-brand-light)]0 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl hover:bg-[var(--color-brand-dark)] hover:shadow-md transition-all cursor-pointer whitespace-nowrap">
                                        Asignar Turno
                                    </button>
                                </div>
                            </div>

                            {/* Listado de Secciones */}
                            <div className="flex items-center justify-between mb-4 pt-4 border-t border-slate-100">
                                <h3 className="text-base font-black text-slate-800">Listado de Secciones</h3>
                                <div className="flex gap-2">
                                    <select value={filtroSeccionGrado} onChange={e => setFiltroSeccionGrado(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer">
                                        <option value="">Todos los Grados</option>
                                        {grados.map(g => <option key={g.id} value={g.id}>{g.numero}° Grado</option>)}
                                    </select>
                                    <select value={filtroSeccionSede} onChange={e => setFiltroSeccionSede(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer">
                                        <option value="">Todas las Sedes</option>
                                        {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre_sede}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {secciones.filter(sec => {
                                    const matchGrado = filtroSeccionGrado ? sec.id_grado === parseInt(filtroSeccionGrado) : true;
                                    const matchSede = filtroSeccionSede ? sec.id_sede === parseInt(filtroSeccionSede) : true;
                                    return matchGrado && matchSede;
                                }).map(sec => {
                                    const g = grados.find(x => x.id === sec.id_grado);
                                    const s = sedes.find(x => x.id === sec.id_sede);
                                    const turnoIds = [...new Set(seccionTurnos.filter(x => x.id_seccion === sec.id).map(x => x.id_turno))];
                                    const turnoActual = turnoIds.map(id => turnos.find(t => t.id === id)?.nombre || 'Turno no disponible').join(' / ');
                                    const isEditing = editingSeccionId === sec.id;

                                    return (
                                        <div key={sec.id} className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${isEditing ? 'bg-white border-[#2F5BFF]/15 shadow-md ring-2 ring-[#2F5BFF]/10' : 'bg-slate-50 border-slate-100 hover:shadow-sm hover:border-slate-200'}`}>
                                            {isEditing ? (
                                                /* Modo edición */
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nombre</label>
                                                        <input
                                                            type="text"
                                                            value={editSeccionNombre}
                                                            onChange={e => setEditSeccionNombre(e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-[var(--color-brand-primary)]"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Grado</label>
                                                        <select value={editSeccionGrado} onChange={e => setEditSeccionGrado(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer">
                                                            {grados.map(gr => <option key={gr.id} value={gr.id}>{gr.numero}° Grado</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Sede</label>
                                                        <select value={editSeccionSede} onChange={e => setEditSeccionSede(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer">
                                                            {sedes.map(se => <option key={se.id} value={se.id}>{se.nombre_sede}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex gap-2 mt-1">
                                                        <button disabled={!(canRead('seccion') && can('seccion', 'edit'))} onClick={() => handleUpdateSeccion(sec.id)} className="flex-1 py-2 bg-[var(--color-brand-primary)] text-white font-bold text-xs rounded-lg cursor-pointer hover:shadow-sm transition-all flex items-center justify-center gap-1.5">
                                                            <CheckIcon /> Guardar
                                                        </button>
                                                        <button onClick={() => setEditingSeccionId(null)} className="flex-1 py-2 bg-slate-200 text-slate-600 font-bold text-xs rounded-lg cursor-pointer hover:bg-slate-300 transition-all">
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Modo lectura */
                                                <>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-black text-slate-800 text-lg flex items-baseline gap-1.5">
                                                                {sec.nombre}
                                                                <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Grado {g?.numero}°</span>
                                                            </h4>
                                                            <p className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                                                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                                {s?.nombre_sede}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button disabled={!(canRead('seccion') && can('seccion', 'edit'))}
                                                                onClick={() => {
                                                                    setEditingSeccionId(sec.id);
                                                                    setEditSeccionNombre(sec.nombre);
                                                                    setEditSeccionGrado(String(sec.id_grado));
                                                                    setEditSeccionSede(String(sec.id_sede));
                                                                }}
                                                                className="text-slate-400 hover:text-[var(--color-brand-primary)] p-1.5 cursor-pointer hover:bg-[#2F5BFF]/10 rounded-lg transition-all"
                                                                title="Editar sección"
                                                            >
                                                                <EditIcon />
                                                            </button>
                                                            <button disabled={!(canRead('seccion') && can('seccion', 'delete'))} onClick={() => handleDeleteSeccion(sec.id)} className="text-slate-400 hover:text-red-500 p-1.5 cursor-pointer hover:bg-red-50 rounded-lg transition-all" title="Eliminar sección">
                                                                <CloseIcon />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-0">
                                                            Turno: {turnoActual ? (
                                                                <span className="text-[var(--color-brand-primary)] bg-[var(--color-brand-light)] px-2 py-0.5 rounded-md ml-1">{turnoActual}</span>
                                                            ) : (
                                                                <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md ml-1">Sin asignar</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                                {secciones.length === 0 && (
                                    <div className="col-span-full py-10 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        No hay secciones creadas todavía. Usa el formulario de arriba para agregar la primera.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
                .animate-fade-in-down { animation: fadeInDown 0.4s ease-out forwards; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: var(--color-brand-light);
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: var(--color-brand-primary);
                }
            `}
            </style>

            {/* Modal de Confirmación */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform scale-100 transition-all">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 text-center mb-2">{confirmDialog.title}</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">{confirmDialog.message}</p>
                        {operationError && <p role="alert" className="mb-4 text-sm text-red-600">{operationError}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer">Cancelar</button>
                            <button onClick={() => confirmDialog.onConfirm?.()} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 hover:shadow-md transition-all cursor-pointer">Sí, eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </fieldset>
    </>);
}
