/**
 * ine.js — Carga y lógica de datos 100% offline
 *
 * Fuentes en public/municipios_ine.json:
 *   Población:    INE Padrón Municipal, 1 enero 2025
 *   Superficie:   REL Ministerio Política Territorial, 2020
 *   Grupos edad:  INE Nomenclátor 2025
 *   Paro:         SEPE — Paro registrado por municipios, abril 2026
 *   Contratos:    SEPE — Contratos registrados por municipios, abril 2026
 *
 * Nota '<5': el SEPE censura valores entre 1 y 4 por privacidad → se almacenan como 2
 */

export async function cargarMunicipios() {
  const r = await await fetch(`${import.meta.env.BASE_URL}municipios_ine.json`)
  if (!r.ok) throw new Error(`No se pudo cargar municipios_ine.json: HTTP ${r.status}`)
  return r.json()
}

export function buildDataset(municipios, codProv = null) {
  const data = codProv
    ? municipios.filter(m => m.cpro === codProv.padStart(2, '0'))
    : municipios
  return data.map(m => ({
    ...m,
    esRural: m.densidad != null && m.pob2025 < 30_000 && m.densidad < 100,
    sinSuperficie: m.sup_km2 == null,
  })).sort((a, b) => b.pob2025 - a.pob2025)
}

export function agruparCCAA(dataset) {
  const map = new Map()
  for (const m of dataset) {
    const k = m.ccaa || 'Sin CCAA'
    if (!map.has(k)) map.set(k, {
      ccaa: k, nTotal: 0, nRural: 0,
      pob: 0, pobRural: 0, lab: 0, may: 0,
      paro: 0, contratos: 0, pobLab: 0
    })
    const g = map.get(k)
    g.nTotal++; g.pob += m.pob2025
    if (m.esRural) {
      g.nRural++; g.pobRural += m.pob2025
      g.lab  += m.pob_16_64 ?? 0
      g.may  += m.pob_65_mas ?? 0
      g.paro += m.paro_total ?? 0
      g.contratos += m.contr_total ?? 0
      g.pobLab += m.pob_16_64 ?? 0
    }
  }
  return [...map.values()].map(g => ({
    ...g,
    pctRural:  g.nTotal  ? +((g.nRural / g.nTotal) * 100).toFixed(1) : 0,
    pctLab:    g.pobRural ? +((g.lab / g.pobRural) * 100).toFixed(1) : 0,
    pctMay:    g.pobRural ? +((g.may / g.pobRural) * 100).toFixed(1) : 0,
    tasaParo:  g.pobLab  ? +((g.paro / g.pobLab) * 100).toFixed(1) : null,
  })).sort((a, b) => b.nRural - a.nRural)
}

export function toCSV(dataset) {
  const BOM = '\uFEFF'; const SEP = ';'
  const cols = [
    'cod','nombre','provincia','ccaa',
    'pob2025','sup_km2','densidad','es_zona_rural',
    'pob_0_15','pob_16_64','pct_16_64','pob_65_mas','pct_65_mas',
    'paro_total','paro_h_m25','paro_h_25_44','paro_h_m45',
    'paro_m_m25','paro_m_25_44','paro_m_m45',
    'paro_agri','paro_indus','paro_constr','paro_serv',
    'tasa_paro_est',
    'contr_total','contr_h_indef','contr_h_temp','contr_m_indef','contr_m_temp',
    'contr_agri','contr_indus','contr_constr','contr_serv',
    'anio_pob','anio_edad','anio_sup','anio_paro'
  ]
  const rows = dataset.map(m => cols.map(c =>
    c === 'es_zona_rural' ? (m.esRural ? 'SI' : 'NO') :
    typeof m[c] === 'string' && m[c].includes(',') ? `"${m[c]}"` : (m[c] ?? '')
  ).join(SEP))
  return new Blob([BOM + [cols.join(SEP), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
}

export function toJSONBlob(dataset) {
  return new Blob([JSON.stringify({
    metadatos: {
      generado: new Date().toISOString().slice(0,10),
      fuentes: {
        poblacion:  'INE — Revisión Padrón Municipal 2025 (1 enero 2025)',
        superficie: 'Ministerio Política Territorial — REL 2020',
        edad:       'INE — Nomenclátor Nacional 2025 (1 enero 2025)',
        paro:       'SEPE — Paro registrado por municipios, abril 2026',
        contratos:  'SEPE — Contratos registrados por municipios, abril 2026',
      },
      criterio_rural: 'Ley 45/2007 art. 3: pob < 30.000 hab Y densidad < 100 hab/km²',
      nota_censurado: "Valores '<5' (entre 1 y 4) aparecen como 2 por confidencialidad del SEPE",
    },
    municipios: dataset,
  }, null, 2)], { type: 'application/json' })
}
