const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('http://127.0.0.1:8000/api/grado-dia-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_grado: 1,
                id_dia: 1,
                bloques_dia: 6
            })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (e) {
        console.log("Error:", e);
    }
}

test();
