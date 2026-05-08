const gradosDb = [ { id_grado: 1, numero: 1 }, { id_grado: 2, numero: 2 } ];
const diasDb = [ { id_dia: 1, nombre_dia: 'Lunes', orden: 1 }, { id_dia: 2, nombre_dia: 'Martes', orden: 2 } ];
const gradoDiaConfig = { "1-1": 5, "2-2": 6 };

for (const [key, bloques] of Object.entries(gradoDiaConfig)) {
    const [gradoNumStr, diaIdStr] = key.split('-');
    const gradoNum = parseInt(gradoNumStr);
    const diaIdLocal = parseInt(diaIdStr);
    
    const realGrado = gradosDb.find(g => g.numero === gradoNum);
    const realDia = diasDb.find(d => d.orden === diaIdLocal);

    console.log("key:", key, "realGrado:", realGrado, "realDia:", realDia);
}
